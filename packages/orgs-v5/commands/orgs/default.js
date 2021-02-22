'use strict'

let cli = require('heroku-cli-util')

async function run() {
  cli.error(`orgs:default is no longer in the CLI.
Use the HEROKU_ORGANIZATION environment variable instead.
See ${cli.color.cyan('https://devcenter.heroku.com/articles/develop-orgs#default-org')} for more info.`)
}

module.exports = {
  topic: 'orgs',
  command: 'default',
  hidden: true,
  run: cli.command(run)
}
