'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let flags = require('../../lib/flags.js')
let displayWarnings = require('../../lib/display_warnings.js')
let formatEndpoint = require('../../lib/format_endpoint.js')
let certificateDetails = require('../../lib/certificate_details.js')
let getCertAndKey = require('../../lib/get_cert_and_key.js')

function * run (context, heroku) {
  let endpoint = yield flags(context, heroku)

  let files = yield getCertAndKey(context)

  let formattedEndpoint = formatEndpoint(endpoint)

  yield cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will change the certificate of endpoint ${formattedEndpoint} from ${cli.color.app(context.app)}.`)

  let cert = yield cli.action(`Updating SSL certificate ${formattedEndpoint} for ${cli.color.app(context.app)}`, {}, heroku.request({
    path: endpoint._meta.path,
    method: 'PATCH',
    headers: {'Accept': `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`},
    body: {certificate_chain: files.crt, private_key: files.key}
  }))

  certificateDetails(cert, 'Updated certificate details:')
  displayWarnings(cert)
}

module.exports = {
  topic: 'certs',
  command: 'update',
  variableArgs: true,
  args: [
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false}
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
    {name: 'confirm', hasValue: true, hidden: true},
    {name: 'name', hasValue: true, description: 'name to update'},
    {name: 'endpoint', hasValue: true, description: 'endpoint to update'}
  ],
  description: 'update an SSL certificate on an app',
  help: `Note: certificates with PEM encoding are also valid

Example:

    $ heroku certs:update example.com.crt example.com.key

Example (Certificate Intermediary) :

    $ heroku certs:update intermediary.crt example.com.crt example.com.key
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command({preauth: true}, co.wrap(run))
}
