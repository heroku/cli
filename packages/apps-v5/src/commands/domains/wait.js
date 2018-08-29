'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let waitForDomain = require('../../domains_wait')

function * run (context, heroku) {
  let domains
  if (context.args.hostname) {
    domains = [yield heroku.get(`/apps/${context.app}/domains/${encodeURIComponent(context.args.hostname)}`)]
  } else {
    let apiDomains = yield heroku.get(`/apps/${context.app}/domains`)
    domains = apiDomains.filter(domain => domain.status === 'pending')
  }

  for (let domain of domains) {
    yield waitForDomain(context, heroku, domain)
  }
}

module.exports = {
  topic: 'domains',
  command: 'wait',
  description: 'wait for domain to be active for an app',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'hostname', optional: true }],
  run: cli.command(co.wrap(run))
}
