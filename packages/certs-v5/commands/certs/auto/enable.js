'use strict'

let cli = require('heroku-cli-util')
let {waitForDomains, printDomains, waitForCertIssuedOnDomains} = require('../../../lib/domains')
const {notify} = require('../../../lib/notify')

async function enable(context, heroku) {
  const domains = await heroku.get(`/apps/${context.app}/domains`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
  })
  await heroku.post(`/apps/${context.app}/acm`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    body: {},
  })
  if (context.flags.wait) {
    cli.action.done(`${cli.color.yellow('starting')}.`)
  } else {
    cli.action.done(`${cli.color.yellow('starting')}. See status with ${cli.color.cmd('heroku certs:auto')} or wait until active with ${cli.color.cmd('heroku certs:auto --wait')}`)
  }

  return domains
}

async function run(context, heroku) {
  let domainsBeforeEnable = await cli.action('Enabling Automatic Certificate Management', enable(context, heroku))

  if (context.flags.wait) {
    try {
      await waitForCertIssuedOnDomains(context, heroku)
      notify('heroku certs:auto:enable', 'Certificate issued to all domains')
    } catch (error) {
      notify('heroku certs:auto:enable', 'An error occurred', false)
      cli.styledHeader(`${cli.color.red('Error')}: The certificate could not be issued to all domains. See status with ${cli.color.cmd('heroku certs:auto')}.`)
      throw error
    }
  }

  let domains = await waitForDomains(context, heroku)

  // only output the domains table if stable cname was enabled as part of ACM enabling
  let changedCnames = domains.filter(function (domain) {
    let domainBeforeEnable = domainsBeforeEnable.find(domainBefore => domain.hostname === domainBefore.hostname)
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
  flags: [
    {name: 'wait', description: 'watch ACM status and exit when complete'},
  ],
  run: cli.command(run),
}
