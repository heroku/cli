'use strict'

let cli = require('heroku-cli-util')
let Utils = require('../../lib/utils')

async function run(context, heroku) {
  let teams = await heroku.get('/teams')
  if (context.flags.json) Utils.printGroupsJSON(teams)
  else Utils.printGroups(teams, { label: 'Teams' })
}

module.exports = {
  topic: 'teams',
  description: `list the teams that you are a member of

Use ${cli.color.cmd('heroku members:*')} to manage team members.`,
  needsAuth: true,
  flags: [
    { name: 'json', description: 'output in json format' }
  ],
  run: cli.command(run)
}
