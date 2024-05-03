'use strict'

let cli = require('@heroku/heroku-cli-util')

// let error = require('../../lib/error.js')
// let readFile = require('../../lib/read_file.js')

async function run(context) {
  // TODO: Fix chain command

  //   if (context.args.length === 0) {
  //     error.exit(1, 'Usage: heroku certs:chain CRT [CRT ...]\nMust specify at least one certificate file.')
  //   }

  //   let res = await Promise.all(context.args.map(function (arg) { return readFile(arg) }))

  //   cli.console.writeLog(body)
}

module.exports = {
  topic: 'certs',
  command: 'chain',
  description: 'print an ordered & complete chain for a certificate',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(run),
}
