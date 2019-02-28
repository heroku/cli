'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
const { flags } = require('@heroku-cli/command')

function * run (context, heroku) {
  let team = context.org || context.team || context.flags.team
  if (!team) throw new Error('No team specified')
  let org = yield heroku.get(`/teams/${team}`)
  yield cli.open(`https://dashboard.heroku.com/teams/${org.name}`)
}

module.exports = {
  topic: 'orgs',
  command: 'open',
  description: 'open the team interface in a browser window',
  needsAuth: true,
  wantsOrg: true,
  flags: [
    flags.team({ name: 'team', hasValue: true, hidden: true })
  ],
  run: cli.command(co.wrap(run))
}
