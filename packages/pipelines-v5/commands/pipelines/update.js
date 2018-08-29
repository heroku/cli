'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
const updateCoupling = require('../../lib/api').updateCoupling
const { StageCompletion } = require('@heroku-cli/command/lib/completions')

module.exports = {
  topic: 'pipelines',
  command: 'update',
  description: 'update this app\'s stage in a pipeline',
  examples: `$ heroku pipelines:update -s staging -a example-admin
Changing example-admin to staging... done`,
  needsApp: true,
  needsAuth: true,
  flags: [
    { name: 'stage', char: 's', description: 'new stage of app', hasValue: true, completion: StageCompletion }
  ],
  run: cli.command(co.wrap(function * (context, heroku) {
    if (!context.flags.stage) {
      cli.error('Stage must be specified with -s')
      process.exit(1)
    }

    const app = context.app
    const stage = context.flags.stage

    yield cli.action(`Changing ${cli.color.app(app)} to ${stage}`,
      updateCoupling(heroku, app, stage))
  }))
}
