'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const disambiguate = require('../../lib/disambiguate')
const listPipelineApps = require('../../lib/api').listPipelineApps
const sortBy = require('lodash.sortby')
const PipelineOwner = require('../../lib/ownership')

module.exports = {
  topic: 'pipelines',
  command: 'info',
  description: 'show list of apps in a pipeline',
  help: `Example:

  $ heroku pipelines:info example
  name:  example
  owner: my-team (team)

  app name                     stage
  ───────────────────────────  ──────────
  ⬢ example-pr-16              review
  ⬢ example-pr-19              review
  ⬢ example-pr-23              review
  ⬢ example-staging            staging
  ⬢ example-staging-2          staging
  ⬢ example-production         production`,
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
    const pipelineApps = yield listPipelineApps(heroku, pipeline.id)
    let owner

    if (context.flags.json) {
      cli.styledJSON({pipeline, apps: pipelineApps})
    } else {
      cli.log(`name:  ${pipeline.name}`)

      if (pipeline.owner) {
        owner = yield PipelineOwner.getOwner(heroku, pipelineApps, pipeline)
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

      const developmentApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'development'), ['name'])
      const reviewApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'review'), ['name'])
      const stagingApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'staging'), ['name'])
      const productionApps = sortBy(pipelineApps.filter(app => app.coupling.stage === 'production'), ['name'])
      const apps = developmentApps.concat(reviewApps).concat(stagingApps).concat(productionApps)

      cli.table(apps, { columns })

      if (pipeline.owner) {
        PipelineOwner.warnMixedOwnership(pipelineApps, pipeline, owner)
      }
    }
  }))
}
