'use strict'

let cli = require('heroku-cli-util')
let Utils = require('../../lib/utils')

async function run(context, heroku) {
  let orgs = await heroku.get('/teams')

  if (context.flags.enterprise) {
    orgs = orgs.filter(o => o.type === 'enterprise')
  }

  if (context.flags.json) {
    Utils.printGroupsJSON(orgs)
  } else {
    Utils.printGroups(orgs, { label: 'Teams' })
  }
}

module.exports = {
  topic: 'orgs',
  description: 'list the teams that you are a member of',
  needsAuth: true,
  flags: [
    { name: 'json', description: 'output in json format' },
    { name: 'enterprise', hasValue: false, description: 'filter by enterprise teams' },
    { name: 'teams', hasValue: false, description: 'filter by teams', hidden: true }
  ],
  run: cli.command(run)
}
