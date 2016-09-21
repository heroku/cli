'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let _ = require('lodash')
let inquirer = require('inquirer')
let psl = require('psl')

let error = require('../../lib/error.js')
let readFile = require('../../lib/read_file.js')
let findMatch = require('../../lib/find_match.js')
let endpoints = require('../../lib/endpoints.js')
let sslDoctor = require('../../lib/ssl_doctor.js')
let displayWarnings = require('../../lib/display_warnings.js')
let certificateDetails = require('../../lib/certificate_details.js')
let isWildcard = require('../../lib/is_wildcard.js')
let isWildcardMatch = require('../../lib/is_wildcard_match.js')

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

function * getFiles (context) {
  let files = yield {
    crt: readFile(context.args.CRT),
    key: readFile(context.args.KEY)
  }

  let crt, key
  if (context.flags.bypass) {
    crt = files.crt
    key = files.key
  } else {
    let res = JSON.parse(yield sslDoctor('resolve-chain-and-key', [files.crt, files.key]))
    crt = res.pem
    key = res.key
  }

  return {crt, key}
}

function getFlagChoices (context, certDomains, existingDomains) {
  let flagDomains = context.flags.domains.split(',').map((str) => str.trim()).filter((str) => str !== '')
  let choices = _.difference(flagDomains, existingDomains)

  let badChoices = _.remove(choices, (choice) => (!_.find(certDomains, (certDomain) => certDomain === choice)))
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

  let apiDomains = yield heroku.request({
    path: `/apps/${context.app}/domains`
  })

  let existingDomains = []
  let newDomains = []

  certDomains.forEach(function (certDomain) {
    let matches = findMatch(certDomain, apiDomains)
    if (matches) {
      existingDomains.push(certDomain)
    } else {
      newDomains.push(certDomain)
    }
  })

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

  let type = function (domain) {
    return psl.parse(domain.hostname).subdomain === null ? 'ALIAS/ANAME' : 'CNAME'
  }

  let hasWildcard = _.some(certDomains, (certDomain) => isWildcard(certDomain))

  let domainsTable = apiDomains.concat(domains.added)
    .filter((domain) => domain.kind === 'custom')
    .map(function (domain) {
      let warning = null
      if (hasWildcard && domain.hostname) {
        let hasMatch = _.some(certDomains, function (certDomain) {
          return domain.hostname === certDomain || isWildcardMatch(certDomain, domain.hostname)
        })

        if (!hasMatch) {
          warning = '! Does not match any domains on your SSL certificate'
        }
      }

      return Object.assign({}, domain, {type: type(domain), warning: warning})
    })

  if (domainsTable.length === 0) {
    /* eslint-disable no-irregular-whitespace */
    cli.styledHeader(`Your certificate has been added successfully.  Add a custom domain to your app by running ${cli.color.app('heroku domains:add <yourdomain.com>')}`)
    /* eslint-enable no-irregular-whitespace */
  } else {
    cli.styledHeader("Your certificate has been added successfully.  Update your application's DNS settings as follows")

    let columns = [
        {label: 'Domain', key: 'hostname'},
        {label: 'Record Type', key: 'type'},
        {label: 'DNS Target', key: 'cname'}
    ]

    if (_.some(domainsTable, (domain) => domain.warning)) {
      columns.push({label: 'Warnings', key: 'warning'})
    }

    cli.table(domainsTable, {columns: columns})
  }

  if (domains.hasFailed) {
    error.exit(2)
  }
}

function * run (context, heroku) {
  let meta = yield getMeta(context, heroku)

  let files = yield getFiles(context)

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

  if (meta.type !== 'SNI' || cert.cname) {
    cli.log(`${cli.color.app(context.app)} now served by ${cli.color.green(cert.cname)}`)
  }

  certificateDetails(cert)

  yield addDomains(context, heroku, meta, cert)

  displayWarnings(cert)
}

let cmd = {
  command: 'add',
  args: [
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false}
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
    {name: 'type', description: "type to create, either 'sni' or 'endpoint'", hasValue: true},
    {name: 'domains', description: 'domains to create after certificate upload', hasValue: true}
  ],
  description: 'add an SSL certificate to an app',
  help: `Example:

 $ heroku certs:add example.com.crt example.com.key
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'certs'}, cmd),
  Object.assign({topic: '_certs', hidden: true}, cmd)
]
