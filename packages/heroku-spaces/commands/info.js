'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const lib = require('../lib/spaces')

function * run (context, heroku) {
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:info my-space')

  let headers = {}
  if (!context.flags.json) {
    headers = { 'Accept-Expansion': 'region' }
  }

  let space = yield heroku.get(`/spaces/${spaceName}`, {headers})
  if (space.state === 'allocated') {
    space.outbound_ips = yield heroku.get(`/spaces/${spaceName}/nat`)
  }
  render(space, context.flags)
}

function render (space, flags) {
  if (flags.json) {
    cli.log(JSON.stringify(space, null, 2))
  } else {
    cli.styledHeader(space.name)
    cli.styledObject({
      ID: space.id,
      Team: space.team.name,
      Region: space.region.description,
      State: space.state,
      Shield: lib.displayShieldState(space),
      'Outbound IPs': lib.displayNat(space.outbound_ips),
      'Created at': space.created_at
    }, ['ID', 'Team', 'Region', 'State', 'Shield', 'Outbound IPs', 'Created at'])
  }
}

module.exports = {
  topic: 'spaces',
  command: 'info',
  description: 'show info about a space',
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get info of'},
    {name: 'json', description: 'output in json format'}
  ],
  render: render,
  run: cli.command(co.wrap(run))
}
