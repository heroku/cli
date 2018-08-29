'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let app = cli.color.app(context.app)
  let warning = `This command will disable Automatic Certificate Management from ${app}.
This will cause the certificate to be removed from ${app} causing SSL
validation errors.  In order to avoid downtime, the recommended steps
are preferred which will also disable Automatic Certificate Management.

1) Request a new SSL certificate for your domains names from your certificate provider
2) heroku certs:update CRT KEY
`

  yield cli.confirmApp(context.app, context.flags.confirm, warning)

  yield cli.action('Disabling Automatic Certificate Management', heroku.request({
    method: 'DELETE',
    path: `/apps/${context.app}/acm`,
    headers: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
  }))
}

module.exports = {
  topic: 'certs',
  command: 'auto:disable',
  description: 'disable ACM for an app',
  flags: [
    { name: 'confirm', hasValue: true, hidden: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
