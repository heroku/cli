'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:create --space my-space --org my-org')
  let request = heroku.request({
    method: 'POST',
    path: '/spaces',
    body: {
      name: space,
      organization: context.org,
      channel_name: context.flags.channel,
      region: context.flags.region,
      log_drain_url: context.flags['log-drain-url']
    }
  })
  cli.warn(`${cli.color.bold('Spend Alert.')} Each Heroku Private Space costs $1000 in Add-on Credits/month (pro-rated to the second).`)
  space = yield cli.action(`Creating space ${cli.color.green(space)} in organization ${cli.color.cyan(context.org)}`, request)
  cli.styledHeader(space.name)
  cli.styledObject({
    ID: space.id,
    Organization: space.organization.name,
    Region: space.region.name,
    State: space.state,
    'Created at': space.created_at
  }, ['ID', 'Organization', 'Region', 'State', 'Created at'])
}

module.exports = {
  topic: 'spaces',
  command: 'create',
  description: 'create a new space',
  help: `
Example:
  $ heroku spaces:create --space my-space --org my-org --region oregon
  Creating space my-space in organization my-org... done
  === my-space
  ID:           e7b99e37-69b3-4475-ad47-a5cc5d75fd9f
  Organization: my-org
  Region:       oregon
  State:        allocating
  Created at:   2016-01-06T03:23:13Z
  `,
  needsApp: false,
  needsOrg: true,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'name of space to create'},
    {name: 'channel', hasValue: true, hidden: true},
    {name: 'region', hasValue: true, description: 'region name'},
    {name: 'log-drain-url', hasValue: true, hidden: true, description: 'direct log drain url'}
  ],
  run: cli.command(co.wrap(run))
}
