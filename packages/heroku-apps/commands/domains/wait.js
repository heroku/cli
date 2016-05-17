'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let waitForDomain = require('../../lib/domains_wait')

function * run (context, heroku) {
  let domain = yield heroku.request({
    path: `/apps/${context.app}/domains/${encodeURIComponent(context.args.hostname)}`
  })

  yield waitForDomain(context, heroku, domain)
}

module.exports = {
  topic: 'domains',
  command: 'wait',
  description: 'wait for domain to be active for an app',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'hostname'}],
  run: cli.command(co.wrap(run))
}
