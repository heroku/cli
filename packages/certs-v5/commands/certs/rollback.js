'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let flags = require('../../lib/flags.js')
let error = require('../../lib/error.js')
let displayWarnings = require('../../lib/display_warnings.js')
let formatEndpoint = require('../../lib/format_endpoint.js')
let certificateDetails = require('../../lib/certificate_details.js')

function * run (context, heroku) {
  let endpoint = yield flags(context, heroku)
  if (endpoint._meta.flag === 'sni') {
    error.exit(1, 'SNI Endpoints cannot be rolled back, please update with a new cert.')
  }

  let formattedEndpoint = formatEndpoint(endpoint)

  yield cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will change the certificate of endpoint ${formattedEndpoint} from ${cli.color.app(context.app)}.`)

  let cert = yield cli.action(`Rolling back SSL certificate ${formattedEndpoint} for ${cli.color.app(context.app)}`, {}, heroku.request({
    path: `/apps/${context.app}/ssl-endpoints/${encodeURIComponent(endpoint.cname)}`,
    method: 'PATCH',
    headers: { 'Accept': 'application/vnd.heroku+json; version=3.ssl_cert' },
    body: {
      rollback: true
    }
  }))

  displayWarnings(cert)
  certificateDetails(cert, 'New active certificate details:')
}

module.exports = {
  topic: 'certs',
  command: 'rollback',
  flags: [
    { name: 'confirm', hasValue: true, optional: true, hidden: true },
    { name: 'name', hasValue: true, description: 'name to rollback' },
    { name: 'endpoint', hasValue: true, description: 'endpoint to rollback' }
  ],
  description: 'rollback an SSL certificate from an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
