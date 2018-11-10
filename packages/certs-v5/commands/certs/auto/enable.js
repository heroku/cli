'use strict'

let cli = require('heroku-cli-util')
let { waitForDomains, printDomains } = require('../../../lib/domains')

async function enable (context, heroku) {
  const domains = await heroku.get(`/apps/${context.app}/domains`, {
    headers: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
  })
  await heroku.post(`/apps/${context.app}/acm`, {
    headers: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' },
    body: {}
  })
  cli.action.done(`${cli.color.yellow('starting')}. See status with ${cli.color.cmd('heroku certs:auto')} or wait until active with ${cli.color.cmd('heroku certs:auto:wait')}`)
  return domains
}

async function run (context, heroku) {
  let domainsBeforeEnable = await cli.action('Enabling Automatic Certificate Management', enable(context, heroku))

  let domains = await waitForDomains(context, heroku)

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
  description: 'enable ACM status for an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run)
}
