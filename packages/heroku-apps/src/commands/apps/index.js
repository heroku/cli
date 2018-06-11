'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const {flags} = require('@heroku-cli/command')
const {SpaceCompletion} = require('@heroku-cli/command/lib/completions')

function * run (context, heroku) {
  const {sortBy, partition} = require('lodash')

  let team = context.org || context.team || context.flags.team
  let org = (!context.flags.personal && team) ? team : null
  let space = context.flags.space
  if (space) org = (yield heroku.get(`/spaces/${space}`)).organization.name

  function regionizeAppName (app) {
    let name = app.locked ? `${app.name} [locked]` : app.name
    if (app.region && app.region.name !== 'us') {
      return `${name} (${cli.color.green(app.region.name)})`
    } else {
      return name
    }
  }

  function listApps (apps) {
    apps.forEach((app) => cli.log(regionizeAppName(app)))
    cli.log()
  }

  function print (apps, user) {
    if (apps.length === 0) {
      if (space) cli.log(`There are no apps in space ${cli.color.green(space)}.`)
      else if (org) cli.log(`There are no apps in team ${cli.color.magenta(org)}.`)
      else cli.log('You have no apps.')
    } else if (space) {
      cli.styledHeader(`Apps in space ${cli.color.green(space)}`)
      listApps(apps)
    } else if (org) {
      cli.styledHeader(`Apps in team ${cli.color.magenta(org)}`)
      listApps(apps)
    } else {
      apps = partition(apps, (app) => app.owner.email === user.email)
      if (apps[0].length > 0) {
        cli.styledHeader(`${cli.color.cyan(user.email)} Apps`)
        listApps(apps[0])
      }

      if (apps[1].length > 0) {
        cli.styledHeader('Collaborated Apps')
        cli.table(apps[1], {
          printHeader: false,
          columns: [
            {key: 'name', get: regionizeAppName},
            {key: 'owner.email'}
          ]
        })
      }
    }
  }

  let path = '/users/~/apps'
  if (org) path = `/organizations/${org}/apps`
  else if (context.flags.all) path = '/apps'
  let [apps, user] = yield [
    heroku.get(path),
    heroku.get('/account')
  ]
  apps = sortBy(apps, 'name')
  if (space) {
    apps = apps.filter(a => a.space && (a.space.name === space || a.space.id === space))
  }

  if (context.flags.json) {
    cli.styledJSON(apps)
  } else {
    print(apps, user)
  }
}

let cmd = {
  description: 'list your apps',
  examples: `$ heroku apps
=== My Apps
example
example2

=== Collaborated Apps
theirapp   other@owner.name`,
  needsAuth: true,
  wantsOrg: true,
  flags: [
    {name: 'all', char: 'A', description: 'include apps in all teams'},
    {name: 'json', description: 'output in json format'},
    {name: 'space', char: 's', hasValue: true, description: 'filter by space', completion: SpaceCompletion},
    {name: 'personal', char: 'p', description: 'list apps in personal account when a default team is set'},
    // flags.org({name: 'org', hasValue: true}),
    flags.team({name: 'team', hasValue: true})
  ],
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'apps'}, cmd),
  Object.assign({topic: 'list', hidden: true}, cmd),
  Object.assign({topic: 'apps', command: 'list', hidden: true}, cmd)
]
