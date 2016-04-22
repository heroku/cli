'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let lib = require('../lib/spaces')()
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:info my-space')
  let space = yield heroku.get(`/spaces/${spaceName}`)
  if (space.state === 'allocated') {
    space.outbound_ips = yield heroku.get(`/spaces/${spaceName}/nat`)
  }
  if (context.flags.json) {
    cli.log(JSON.stringify(space, null, 2))
  } else {
    cli.styledHeader(space.name)
    cli.styledObject({
      ID: space.id,
      Organization: space.organization.name,
      Region: space.region.name,
      State: space.state,
      'Outbound IPs': lib.displayNat(space.outbound_ips),
      'Created at': space.created_at
    }, ['ID', 'Organization', 'Region', 'State', 'Outbound IPs', 'Created at'])
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
  run: cli.command(co.wrap(run))
}
