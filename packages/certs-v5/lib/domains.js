'use strict'

let _ = require('lodash')
let cli = require('heroku-cli-util')
let psl = require('psl')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function type (domain) {
  return psl.parse(domain.hostname).subdomain === null ? 'ALIAS/ANAME' : 'CNAME'
}

async function waitForDomains (context, heroku) {
  function someNull (domains) {
    return _.some(domains, (domain) => domain.kind === 'custom' && !domain.cname)
  }

  function apiRequest (context, heroku) {
    return heroku.get(`/apps/${context.app}/domains`)
  }

  let apiDomains = await apiRequest(context, heroku)

  if (someNull(apiDomains)) {
    await cli.action('Waiting for stable domains to be created', (async function () {
      let i = 0
      do {
        // trying 30 times was easier for me to test that setTimeout
        if (i >= 30) {
          throw new Error('Timed out while waiting for stable domains to be created')
        }

        await wait(1000)
        apiDomains = await apiRequest(context, heroku)

        i++
      } while (someNull(apiDomains))
    })())
  }

  return apiDomains
}

function printDomains (domainsTable, msg) {
  domainsTable = domainsTable.filter((domain) => domain.kind === 'custom')
  domainsTable = domainsTable.map(domain => Object.assign({}, domain, {type: type(domain)}))

  if (domainsTable.length === 0) {
    /* eslint-disable no-irregular-whitespace */
    cli.styledHeader(`${msg}  Add a custom domain to your app by running ${cli.color.app('heroku domains:add <yourdomain.com>')}`)
    /* eslint-enable no-irregular-whitespace */
  } else {
    cli.styledHeader(`${msg}  Update your application's DNS settings as follows`)

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
}

async function waitForCertIssuedOnDomains(context, heroku) {
  function certIssuedOrFailedForAllCustomDomains (domains) {
    domains = domains.filter((domain) => domain.kind === 'custom')
    return _.every(domains, (domain) => domain.acm_status === 'cert issued' || domain.acm_status === 'failed')
  }

  function apiRequest (context, heroku) {
    return heroku.get(`/apps/${context.app}/domains`)
  }

  let domains = await apiRequest(context, heroku)

  if (!certIssuedOrFailedForAllCustomDomains(domains)) {
    await cli.action('Waiting until the certificate is issued to all domains', (async function () {
      let i = 0;
      do {
        await wait(1000)
        domains = await apiRequest(context, heroku)

      } while (!certIssuedOrFailedForAllCustomDomains(domains))
    })())
  }
}

module.exports = {waitForDomains, printDomains, waitForCertIssuedOnDomains}
