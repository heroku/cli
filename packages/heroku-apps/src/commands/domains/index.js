'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let domains = yield heroku.request({path: `/apps/${context.app}/domains`})
  if (context.flags.json) {
    cli.log(JSON.stringify(domains, null, 2))
  } else {
    let herokuDomains = domains.filter((d) => d.kind === 'heroku')
    let customDomains = domains.filter((d) => d.kind !== 'heroku')
    cli.styledHeader(`${context.app} Heroku Domain`)
    if (herokuDomains.length === 0) {
      cli.warn('Not found')
    } else {
      herokuDomains.forEach((d) => cli.log(d.hostname))
    }
    cli.log()
    if (customDomains.length > 0) {
      customDomains.forEach((record) => {
        record.recordType = isApexDomain(record.hostname) ? 'ALIAS or ANAME' : 'CNAME'
      })
      cli.styledHeader(`${context.app} Custom Domains`)
      cli.table(customDomains, {
        columns: [
          {key: 'hostname', label: 'Domain Name'},
          {key: 'recordType', label: 'DNS Record Type'},
          {key: 'cname', label: 'DNS Target'}
        ]
      })
    }
  }
}

function isApexDomain (hostname) {
  if (hostname.includes('*')) return false
  let Uri = require('urijs')
  let a = new Uri('http://' + hostname)
  return a.subdomain() === ''
}

module.exports = {
  topic: 'domains',
  description: 'list domains for an app',
  examples: `$ heroku domains
=== example Heroku Domain
example.herokuapp.com

=== example Custom Domains
Domain Name      DNS Record Type  DNS Target
───────────      ───────────────  ──────────
www.example.com  CNAME            www.example.herokudns.com`,
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
