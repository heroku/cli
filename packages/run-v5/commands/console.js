'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let helpers = require('../lib/helpers')
let Dyno = require('../lib/dyno')

function * run (context, heroku) {
  let opts = {
    heroku: heroku,
    app: context.app,
    command: helpers.buildCommand(['console']),
    size: context.flags.size,
    env: context.flags.env,
    attach: true
  }

  let dyno = new Dyno(opts)
  yield dyno.start()
}

module.exports = {
  topic: 'console',
  hidden: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'env', char: 'e', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true}
  ],
  run: cli.command(co.wrap(run))
}
