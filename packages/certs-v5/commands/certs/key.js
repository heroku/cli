'use strict'

let cli = require('heroku-cli-util')

let error = require('../../lib/error.js')
let readFile = require('../../lib/read_file.js')

async function run(context) {
  if (context.args.length < 2) {
    error.exit(1, 'Usage: heroku certs:key CRT KEY [KEY ...]\nMust specify one certificate file and at least one key file.')
  }

  let res = await Promise.all(context.args.map(function (arg) { return readFile(arg) }))

  cli.console.writeLog(body.key)
}

module.exports = {
  topic: 'certs',
  command: 'key',
  description: 'print the correct key for the given certificate',
  help: 'You must pass one single certificate, and one or more keys.\nThe first key that signs the certificate will be printed back.',
  examples: '$ heroku certs:key example.com.crt example.com.key',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(run)
}
