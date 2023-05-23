'use strict'

const cli = require('heroku-cli-util')
const {flags} = require('@heroku-cli/command')
const _ = require('lodash')

function display(spaces) {
  cli.table(spaces, {
    columns: [
      {key: 'name', label: 'Name'},
      {key: 'team.name', label: 'Team'},
      {key: 'region.name', label: 'Region'},
      {key: 'state', label: 'State'},
      {key: 'created_at', label: 'Created At'},
    ],
  })
}

function displayJSON(spaces) {
  cli.log(JSON.stringify(spaces, null, 2))
}

async function run(context, heroku) {
  let team = context.flags.team

  let spaces = await heroku.get('/spaces')
  if (team) {
    spaces = spaces.filter(s => s.team.name === team)
  }

  spaces = _.sortBy(spaces, 'name')
  if (context.flags.json) displayJSON(spaces)
  else if (spaces.length === 0) {
    if (team) throw new Error(`No spaces in ${cli.color.cyan(team)}.`)
    else throw new Error('You do not have access to any spaces.')
  } else {
    display(spaces)
  }
}

module.exports = {
  topic: 'spaces',
  description: 'list available spaces',
  needsAuth: true,
  wantsOrg: true,
  flags: [
    {name: 'json', description: 'output in json format'},
    flags.team({name: 'team', hasValue: true}),
  ],
  run: cli.command(run),
}
