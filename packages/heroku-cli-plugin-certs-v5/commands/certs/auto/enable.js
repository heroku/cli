'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let {waitForDomains, printDomains} = require('../../../lib/domains')

function enable (context, heroku) {
  return heroku.request({
    path: `/apps/${context.app}/domains`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'}
  })
  .then(function (domains) {
    return heroku.request({
      method: 'POST',
      path: `/apps/${context.app}/acm`,
      headers: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'},
      body: {}
    })
    .then(function () {
      return domains
    })
  })
}

function * run (context, heroku) {
  let domainsBeforeEnable = yield cli.action('Enabling Automatic Certificate Management', enable(context, heroku))

  let domains = yield waitForDomains(context, heroku)

  // only output the domains table if stable cname was enabled as part of ACM enabling
  let changedCnames = domains.filter(function (domain) {
    let domainBeforeEnable = domainsBeforeEnable.find((domainBefore) => domain.hostname === domainBefore.hostname)
    return domainBeforeEnable && domain.cname !== domainBeforeEnable.cname
  })

  let message = `Your certificate will now be managed by Heroku.  Check the status by running ${cli.color.cmd('heroku certs:auto')}.`
  if (domains.length === 0 || changedCnames.length > 0) {
    printDomains(changedCnames, message)
  } else {
    cli.styledHeader(message)
  }
}

module.exports = {
  topic: 'certs',
  command: 'auto:enable',
  description: 'Enable ACM status for an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
