'use strict'

const cli = require('heroku-cli-util')
const lib = require('../lib/spaces')

async function run(context, heroku) {
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:info my-space')

  let headers = {}
  if (!context.flags.json) {
    headers = {'Accept-Expansion': 'region'}
  }

  let space = await heroku.get(`/spaces/${spaceName}`, {headers})
  if (space.state === 'allocated') {
    try {
      space.outbound_ips = await heroku.get(`/spaces/${spaceName}/nat`)
    } catch (error) {
      const debug = require('debug')('spaces:info')
      debug(`Retrieving NAT details for the space failed with ${error}`)
    }
  }

  render(space, context.flags)
}

function render(space, flags) {
  if (flags.json) {
    cli.log(JSON.stringify(space, null, 2))
  } else {
    cli.styledHeader(space.name)
    cli.styledObject({
      ID: space.id,
      Team: space.team.name,
      Region: space.region.description,
      CIDR: space.cidr,
      'Data CIDR': space.data_cidr,
      State: space.state,
      Shield: lib.displayShieldState(space),
      'Outbound IPs': lib.displayNat(space.outbound_ips),
      'Created at': space.created_at,
    }, ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Outbound IPs', 'Created at'])
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
    {name: 'json', description: 'output in json format'},
  ],
  render: render,
  run: cli.command(run),
}
