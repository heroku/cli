'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const sortBy = require('lodash.sortby')
  const partition = require('lodash.partition')

  let org = (!context.flags.personal && context.org) ? context.org : null
  let space = context.flags.space
  if (space) org = (yield heroku.get(`/spaces/${space}`)).organization.name

  function regionizeAppName (app) {
    if (app.region && app.region.name !== 'us') {
      return `${app.name} (${cli.color.green(app.region.name)})`
    } else {
      return app.name
    }
  }

  let isNotOrgApp = (app) => !app.owner.email.endsWith('@herokumanager.com')

  function listApps (apps) {
    apps.forEach((app) => cli.log(regionizeAppName(app)))
    cli.log()
  }

  function print (apps, user) {
    if (apps.length === 0) {
      if (space) cli.log(`There are no apps in space ${cli.color.green(space)}.`)
      else if (org) cli.log(`There are no apps in organization ${cli.color.magenta(org)}.`)
      else cli.log('You have no apps.')
      return
    } else if (space) {
      cli.styledHeader(`Apps in space ${cli.color.green(space)}`)
      listApps(apps)
    } else if (org) {
      cli.styledHeader(`Apps in organization ${cli.color.magenta(org)}`)
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

  let requests = yield {
    apps: org ? heroku.get(`/organizations/${org}/apps`) : heroku.get('/apps'),
    user: heroku.get('/account')
  }
  let apps = sortBy(requests.apps, 'name')
  if (!context.flags.all && !org && !space) apps = apps.filter(isNotOrgApp)
  if (space) apps = apps.filter((a) => a.space && (a.space.name === space || a.space.id === space))

  if (context.flags.json) {
    cli.styledJSON(apps)
  } else {
    print(apps, requests.user)
  }
}

module.exports = {
  topic: 'apps',
  command: 'list', hidden: true, // temporary until https://github.com/heroku/api/issues/5885 is fixed
  description: 'list your apps',
  help: `
Example:

 $ heroku apps
 === My Apps
 example
 example2

 === Collaborated Apps
 theirapp   other@owner.name`,
  needsAuth: true,
  wantsOrg: true,
  flags: [
    {name: 'all', char: 'A', description: 'include apps in all organizations'},
    {name: 'json', description: 'output in json format'},
    {name: 'space', hasValue: true, description: 'filter by space', hidden: true},
    {name: 'personal', char: 'p', description: 'list apps in personal account when a default org is set'}
  ],
  run: cli.command(co.wrap(run))
}
