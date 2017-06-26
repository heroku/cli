'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let error = require('../../lib/error.js')
let readFile = require('../../lib/read_file.js')
let sslDoctor = require('../../lib/ssl_doctor.js')

function * run (context) {
  if (context.args.length < 2) {
    error.exit(1, 'Usage: heroku certs:key CRT KEY [KEY ...]\nMust specify one certificate file and at least one key file.')
  }

  let res = yield context.args.map(function (arg) { return readFile(arg) })

  let body = JSON.parse(yield sslDoctor('resolve-chain-and-key', res, 'Testing for signing key'))
  cli.console.writeLog(body.key)
}

module.exports = {
  topic: 'certs',
  command: 'key',
  description: 'print the correct key for the given certificate',
  help: `You must pass one single certificate, and one or more keys.\nThe first key that signs the certificate will be printed back.

Example:

    $ heroku certs:key example.com.crt example.com.key
`,
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(run))
}
