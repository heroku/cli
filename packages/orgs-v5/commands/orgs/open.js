'use strict'

let cli = require('@heroku/heroku-cli-util')
const {flags} = require('@heroku-cli/command')

async function run(context, heroku) {
  let team = context.flags.team
  if (!team) throw new Error('No team specified')
  let org = await heroku.get(`/teams/${team}`)
  await cli.open(`https://dashboard.heroku.com/teams/${org.name}`)
}

module.exports = {
  topic: 'orgs',
  command: 'open',
  description: 'open the team interface in a browser window',
  needsAuth: true,
  wantsOrg: true,
  flags: [
    flags.team({name: 'team', hasValue: true, hidden: true}),
  ],
  run: cli.command(run),
}
