'use strict'

let cli = require('@heroku/heroku-cli-util')
let helpers = require('../lib/helpers')
let Dyno = require('../lib/dyno')

async function run(context, heroku) {
  let opts = {
    heroku: heroku,
    app: context.app,
    command: helpers.buildCommand(['console']),
    size: context.flags.size,
    env: context.flags.env,
    attach: true,
  }

  let dyno = new Dyno(opts)
  await dyno.start()
}

module.exports = {
  topic: 'console',
  hidden: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'env', char: 'e', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true},
  ],
  run: cli.command(run),
}
