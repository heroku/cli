'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const disambiguate = require('../../lib/disambiguate')
const renderPipeline = require('../../lib/render-pipeline')
const listPipelineApps = require('../../lib/api').listPipelineApps

module.exports = {
  topic: 'pipelines',
  command: 'info',
  description: 'show list of apps in a pipeline',
  examples: `$ heroku pipelines:info example
=== example
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
    { name: 'pipeline', description: 'pipeline to show', optional: false }
  ],
  flags: [
    { name: 'json', description: 'output in json format' },
    { name: 'with-owners', description: 'shows owner of every app', hidden: true }
  ],
  run: cli.command(co.wrap(function * (context, heroku) {
    const pipeline = yield disambiguate(heroku, context.args.pipeline)
    const pipelineApps = yield listPipelineApps(heroku, pipeline.id)

    if (context.flags.json) {
      cli.styledJSON({ pipeline, apps: pipelineApps })
    } else {
      yield renderPipeline(heroku, pipeline, pipelineApps, {
        withOwners: context.flags['with-owners'],
        showOwnerWarning: true
      })
    }
  }))
}
