'use strict'

let cli = require('heroku-cli-util')

let flags = require('../../lib/flags.js')
let displayWarnings = require('../../lib/display_warnings.js')
let formatEndpoint = require('../../lib/format_endpoint.js')
let certificateDetails = require('../../lib/certificate_details.js')
let getCertAndKey = require('../../lib/get_cert_and_key.js')

async function run(context, heroku) {
  let endpoint = await flags(context, heroku)

  let files = await getCertAndKey(context)

  let formattedEndpoint = formatEndpoint(endpoint)

  await cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will change the certificate of endpoint ${formattedEndpoint} from ${cli.color.app(context.app)}.`)

  let cert = await cli.action(`Updating SSL certificate ${formattedEndpoint} for ${cli.color.app(context.app)}`, {}, heroku.request({
    path: endpoint._meta.path,
    method: 'PATCH',
    headers: {Accept: `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`},
    body: {certificate_chain: files.crt, private_key: files.key},
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
    {name: 'KEY', optional: false},
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
    {name: 'confirm', hasValue: true, hidden: true},
    {name: 'name', hasValue: true, description: 'name to update'},
    {name: 'endpoint', hasValue: true, description: 'endpoint to update'},
  ],
  description: 'update an SSL certificate on an app',
  help: 'Note: certificates with PEM encoding are also valid',
  examples: `$ heroku certs:update example.com.crt example.com.key

    If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
    https://help.salesforce.com/s/articleView?id=000333504&type=1`,
  needsApp: true,
  needsAuth: true,
  run: cli.command({preauth: true}, run),
}
