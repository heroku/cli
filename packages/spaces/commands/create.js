'use strict'

const cli = require('@heroku/heroku-cli-util')
const lib = require('../lib/spaces')
const parsers = require('../lib/parsers')()
const {flags} = require('@heroku-cli/command')
const {RegionCompletion} = require('@heroku-cli/command/lib/completions')

async function run(context, heroku) {
  let space = context.flags.space || context.args.space
  let dollarAmountMonthly = '$1000'
  let dollarAmountHourly = '$1.39'
  let spaceType = 'Standard'
  if (context.flags.shield) {
    dollarAmountMonthly = '$3000'
    dollarAmountHourly = '$4.17'
    spaceType = 'Shield'
  }

  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:create --space my-space --team my-team')
  let team = context.flags.team
  if (!team) throw new Error('No team specified')
  let request = heroku.request({
    method: 'POST',
    path: '/spaces',
    body: {
      name: space,
      team: team,
      channel_name: context.flags.channel,
      region: context.flags.region,
      features: parsers.splitCsv(context.flags.features),
      log_drain_url: context.flags['log-drain-url'],
      shield: context.flags.shield,
      cidr: context.flags.cidr,
      kpi_url: context.flags['kpi-url'],
      data_cidr: context.flags['data-cidr'],
    },
  })

  space = await cli.action(`Creating space ${cli.color.green(space)} in team ${cli.color.cyan(team)}`, request)
  cli.warn(`${cli.color.bold('Spend Alert.')} During the limited GA period, each Heroku ${spaceType} Private Space costs ~${dollarAmountHourly}/hour (max ${dollarAmountMonthly}/month), pro-rated to the second.`)
  // cli.warn(`${cli.color.bold('Spend Alert.')} Each Heroku ${spaceType} Private Space costs ${dollarAmount} in Add-on Credits/month (pro-rated to the second).`)
  cli.warn('Use spaces:wait to track allocation.')
  cli.styledHeader(space.name)
  cli.styledObject({
    ID: space.id,
    Team: space.team.name,
    Region: space.region.name,
    CIDR: space.cidr,
    'Data CIDR': space.data_cidr,
    State: space.state,
    Shield: lib.displayShieldState(space),
    'Created at': space.created_at,
  }, ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Created at'])
}

module.exports = {
  topic: 'spaces',
  command: 'create',
  description: 'create a new space',
  help: `Example:

    $ heroku spaces:create --space my-space --team my-team --region oregon
    Creating space my-space in team my-team... done
    === my-space
    ID:         e7b99e37-69b3-4475-ad47-a5cc5d75fd9f
    Team:       my-team
    Region:     oregon
    CIDR:       10.0.0.0/16
    Data CIDR:  172.23.0.0/20
    State:      allocating
    Created at: 2016-01-06T03:23:13Z

  `,
  needsApp: false,
  needsAuth: true,
  wantsOrg: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'name of space to create'},
    {name: 'channel', hasValue: true, hidden: true},
    {name: 'region', hasValue: true, description: 'region name', completion: RegionCompletion},
    {name: 'features', hasValue: true, hidden: true, description: 'a list of features separated by commas'},
    {name: 'log-drain-url', hasValue: true, hidden: true, description: 'direct log drain url'},
    {name: 'shield', hasValue: false, hidden: true, description: 'create a Shield space'},
    {name: 'cidr', hasValue: true, description: 'RFC-1918 CIDR the space will use'},
    {name: 'kpi-url', hasValue: true, hidden: true, description: 'self-managed KPI endpoint to use'},
    {name: 'data-cidr', hasValue: true, description: 'RFC-1918 CIDR used by Heroku Data resources for the space'},
    flags.team({name: 'team', hasValue: true}),
  ],
  run: cli.command(run),
}
