'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const disambiguate = require('../../lib/disambiguate')
const listPipelineApps = require('../../lib/api').listPipelineApps
const getTeam = require('../../lib/api').getTeam
const sortBy = require('lodash.sortby')

// For user pipelines we need to use their couplings to determine user email
function getUserPipelineOwner (apps, userId) {
  for (let app in apps) {
    if (apps[app].owner.id === userId) {
      return apps[app].owner.email
    }
  }

  // If pipeline owner doesn't own any application and type is user (unlikely)
  // We return userId as default
  return userId
}

module.exports = {
  topic: 'pipelines',
  command: 'info',
  description: 'show list of apps in a pipeline',
  help: `Example:

    $ heroku pipelines:info example
    === example
    Staging:     example-staging
    Production:  example
    example-admin`,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'pipeline to show', optional: false}
  ],
  flags: [
    {name: 'json', description: 'output in json format'},
    {name: 'with-owners', description: 'shows owner of every app', hidden: true}
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const pipeline = yield disambiguate(heroku, context.args.pipeline)

    let apps = yield listPipelineApps(heroku, pipeline.id)
    const developmentApps = sortBy(apps.filter(app => app.coupling.stage === 'development'), ['name'])
    const reviewApps = sortBy(apps.filter(app => app.coupling.stage === 'review'), ['name'])
    const stagingApps = sortBy(apps.filter(app => app.coupling.stage === 'staging'), ['name'])
    const productionApps = sortBy(apps.filter(app => app.coupling.stage === 'production'), ['name'])

    apps = developmentApps.concat(reviewApps).concat(stagingApps).concat(productionApps)

    if (context.flags.json) {
      cli.styledJSON({pipeline, apps})
    } else {
      cli.log(`name:  ${pipeline.name}`)

      if (pipeline.owner) {
        let owner

        if (pipeline.owner.type === 'team') {
          const team = yield getTeam(heroku, pipeline.owner.id)
          owner = `${team.name} (team)`
        } else {
          owner = getUserPipelineOwner(apps, pipeline.owner.id)
        }
        cli.log(`owner: ${owner}`)
      }
      cli.log('')

      let columns = [
        {key: 'name', label: 'app name', format: (n) => cli.color.app(n)},
        {key: 'coupling.stage', label: 'stage'}
      ]

      if (context.flags['with-owners']) {
        columns.push({
          key: 'owner.email', label: 'owner', format: (e) => e.endsWith('@herokumanager.com') ? `${e.split('@')[0]} (team)` : e
        })
      }

      cli.table(apps, { columns })
    }
  }))
}
