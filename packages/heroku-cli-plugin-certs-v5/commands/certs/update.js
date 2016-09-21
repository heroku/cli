'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let flags = require('../../lib/flags.js')
let readFile = require('../../lib/read_file.js')
let sslDoctor = require('../../lib/ssl_doctor.js')
let displayWarnings = require('../../lib/display_warnings.js')
let certificateDetails = require('../../lib/certificate_details.js')

function * run (context, heroku) {
  let endpoint = yield flags(context, heroku)

  let files = yield {
    crt: readFile(context.args.CRT),
    key: readFile(context.args.KEY)
  }

  let crt, key
  if (context.flags.bypass) {
    crt = files.crt
    key = files.key
  } else {
    let res = JSON.parse(yield sslDoctor('resolve-chain-and-key', [files.crt, files.key]))
    crt = res.pem
    key = res.key
  }

  yield cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will change the certificate of endpoint ${endpoint.name} (${endpoint.cname}) from ${cli.color.app(context.app)}.`)

  let cname = endpoint.cname ? `(${endpoint.cname}) ` : ''

  let cert = yield cli.action(`Updating SSL certificate ${endpoint.name} ${cname}for ${cli.color.app(context.app)}`, {}, heroku.request({
    path: endpoint._meta.path,
    method: 'PATCH',
    headers: {'Accept': `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`},
    body: {certificate_chain: crt, private_key: key}
  }))

  certificateDetails(cert, 'Updated certificate details:')
  displayWarnings(cert)
}

let cmd = {
  command: 'update',
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
  help: `Example:

 $ heroku _certs:update example.com.crt example.com.key
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'certs'}, cmd),
  Object.assign({topic: '_certs', hidden: true}, cmd)
]
