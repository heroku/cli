'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let waitForDomain = require('../../lib/domains_wait')
let shellescape = require('shell-escape')

function * run (context, heroku) {
  let hostname = context.args.hostname
  let domain = yield cli.action(`Adding ${cli.color.green(hostname)} to ${cli.color.app(context.app)}`, heroku.request({
    path: `/apps/${context.app}/domains`,
    method: 'POST',
    body: {hostname}
  }))
  cli.warn(`Configure your app's DNS provider to point to the DNS Target ${cli.color.green(domain.cname)}.
For help, see https://devcenter.heroku.com/articles/custom-domains`)

  if (domain.status !== 'none') {
    cli.console.error('')
    if (context.flags.wait) {
      yield waitForDomain(context, heroku, domain)
    } else {
      cli.console.error(`The domain ${cli.color.green(hostname)} has been enqueued for addition`)
      let command = `heroku domains:wait ${shellescape([hostname])}`
      cli.warn(`Run ${cli.color.cmd(command)} to wait for completion`)
    }
  }
}

module.exports = {
  topic: 'domains',
  command: 'add',
  description: 'add domain to an app',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'hostname'}],
  flags: [{name: 'wait'}],
  run: cli.command(co.wrap(run))
}
