'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let _ = require('lodash')
let inquirer = require('inquirer')

let error = require('../../lib/error.js')
let findMatch = require('../../lib/find_match.js')
let endpoints = require('../../lib/endpoints.js')
let displayWarnings = require('../../lib/display_warnings.js')
let certificateDetails = require('../../lib/certificate_details.js')
let isWildcard = require('../../lib/is_wildcard.js')
let isWildcardMatch = require('../../lib/is_wildcard_match.js')
let getCertAndKey = require('../../lib/get_cert_and_key.js')

let {waitForDomains, printDomains} = require('../../lib/domains')

function Domains (domains) {
  this.domains = domains

  this.added = this.domains.filter((domain) => !domain._failed)
  this.failed = this.domains.filter((domain) => domain._failed)

  this.hasFailed = this.failed.length > 0
}

function * getMeta (context, heroku) {
  let type = context.flags.type

  if (type) {
    switch (type) {
      case 'endpoint':
        return endpoints.meta(context.app, 'ssl')
      case 'sni':
        return endpoints.meta(context.app, 'sni')
      default:
        error.exit(1, "Must pass --type with either 'endpoint' or 'sni'")
    }
  }

  let {hasSpace, hasAddon} = yield {
    hasSpace: endpoints.hasSpace(context.app, heroku),
    hasAddon: endpoints.hasAddon(context.app, heroku)
  }

  if (hasSpace) {
    return endpoints.meta(context.app, 'ssl')
  } else if (!hasAddon) {
    return endpoints.meta(context.app, 'sni')
  } else {
    error.exit(1, "Must pass --type with either 'endpoint' or 'sni'")
  }
}

function hasMatch (certDomains, domain) {
  return _.find(certDomains, (certDomain) => (certDomain === domain || isWildcardMatch(certDomain, domain)))
}

function getFlagChoices (context, certDomains, existingDomains) {
  let flagDomains = context.flags.domains.split(',').map((str) => str.trim()).filter((str) => str !== '')
  let choices = _.difference(flagDomains, existingDomains)

  let badChoices = _.remove(choices, (choice) => (!hasMatch(certDomains, choice)))
  badChoices.forEach(function (choice) {
    cli.warn(`Not adding ${choice} because it is not listed in the certificate`)
  })

  return choices
}

function getPromptChoices (context, certDomains, existingDomains, newDomains) {
  let nonWildcardDomains = newDomains.filter((domain) => !isWildcard(domain))

  if (nonWildcardDomains.length === 0) {
    return Promise.resolve({domains: []})
  }

  return inquirer.prompt([{
    type: 'checkbox',
    name: 'domains',
    message: 'Select domains you would like to add',
    choices: nonWildcardDomains.map(function (domain) {
      return {name: domain}
    })
  }])
}

function * getChoices (certDomains, newDomains, existingDomains, context) {
  if (newDomains.length === 0) {
    return []
  } else {
    if (context.flags.domains !== undefined) {
      return getFlagChoices(context, certDomains, existingDomains)
    } else {
      return (yield getPromptChoices(context, certDomains, existingDomains, newDomains)).domains
    }
  }
}

function * addDomains (context, heroku, meta, cert) {
  let certDomains = cert.ssl_cert.cert_domains

  let apiDomains = yield waitForDomains(context, heroku)

  let existingDomains = []
  let newDomains = []
  let herokuDomains = []

  certDomains.forEach(function (certDomain) {
    let matches = findMatch(certDomain, apiDomains)
    if (matches) {
      if (matches.kind === 'heroku') {
        herokuDomains.push(certDomain)
      } else {
        existingDomains.push(certDomain)
      }
    } else {
      newDomains.push(certDomain)
    }
  })

  if (herokuDomains.length > 0) {
    cli.log()
    cli.styledHeader('The following common names are for hosts that are managed by Heroku')
    herokuDomains.forEach((domain) => cli.log(domain))
  }

  if (existingDomains.length > 0) {
    cli.log()
    cli.styledHeader('The following common names already have domain entries')
    existingDomains.forEach((domain) => cli.log(domain))
  }

  let choices = yield getChoices(certDomains, newDomains, existingDomains, context)
  let domains

  if (choices.length === 0) {
    domains = new Domains([])
  } else {
    // Add a newline between the existing and adding messages
    cli.console.error()

    let promise = Promise.all(choices.map(function (certDomain) {
      return heroku.request({
        path: `/apps/${context.app}/domains`,
        method: 'POST',
        body: {'hostname': certDomain}
      }).catch(function (err) {
        return {_hostname: certDomain, _failed: true, _err: err}
      })
    })).then(function (data) {
      let domains = new Domains(data)
      if (domains.hasFailed) {
        throw domains
      }
      return domains
    })

    let label = choices.length > 1 ? 'domains' : 'domain'
    let message = `Adding ${label} ${choices.map((choice) => cli.color.green(choice)).join(', ')} to ${cli.color.app(context.app)}`
    domains = yield cli.action(message, {}, promise).catch(function (err) {
      if (err instanceof Domains) {
        return err
      }
      throw err
    })
  }

  if (domains.hasFailed) {
    cli.log()
    domains.failed.forEach(function (domain) {
      cli.error(`An error was encountered when adding ${domain._hostname}`)
      cli.error(domain._err)
    })
  }

  cli.log()

  let hasWildcard = _.some(certDomains, (certDomain) => isWildcard(certDomain))

  let domainsTable = apiDomains.concat(domains.added)
    .filter((domain) => domain.kind === 'custom')
    .map(function (domain) {
      let warning = null
      if (hasWildcard && domain.hostname) {
        if (!hasMatch(certDomains, domain.hostname)) {
          warning = '! Does not match any domains on your SSL certificate'
        }
      }

      return Object.assign({}, domain, {warning: warning})
    })

  printDomains(domainsTable, 'Your certificate has been added successfully.')

  if (domains.hasFailed) {
    error.exit(2)
  }
}

function * run (context, heroku) {
  let meta = yield getMeta(context, heroku)

  let files = yield getCertAndKey(context)

  let cert = yield cli.action(`Adding SSL certificate to ${cli.color.app(context.app)}`, {}, heroku.request({
    path: meta.path,
    method: 'POST',
    body: {certificate_chain: files.crt, private_key: files.key},
    headers: {'Accept': `application/vnd.heroku+json; version=3.${meta.variant}`}
  }))

  cert._meta = meta

  // Remove the warning for SNI endpoints because we will provide our own error
  if (cert.warnings && cert.warnings.ssl_cert) {
    _.pull(cert.warnings.ssl_cert, 'provides no domain(s) that are configured for this Heroku app')
  }

  if (meta.flag !== 'sni' || cert.cname) {
    cli.log(`${cli.color.app(context.app)} now served by ${cli.color.green(cert.cname)}`)
  }

  certificateDetails(cert)

  yield addDomains(context, heroku, meta, cert)

  displayWarnings(cert)
}

const CertTypeCompletion = {
  skipCache: true,
  options: (ctx) => {
    return ['sni', 'endpoint']
  }
}

module.exports = {
  topic: 'certs',
  command: 'add',
  variableArgs: true,
  args: [
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false}
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
    {name: 'type', description: "type to create, either 'sni' or 'endpoint'", hasValue: true, completion: CertTypeCompletion},
    {name: 'domains', description: 'domains to create after certificate upload', hasValue: true}
  ],
  description: 'add an SSL certificate to an app',
  help: `Note: certificates with PEM encoding are also valid

Example:

    $ heroku certs:add example.com.crt example.com.key

Example (Certificate Intermediary):

     $ heroku certs:add intermediary.crt example.com.crt example.com.key
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
