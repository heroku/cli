'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let disambiguate = require('../../lib/disambiguate')

module.exports = {
  topic: 'pipelines',
  command: 'open',
  description: 'open a pipeline in dashboard',
  examples: '$ heroku pipelines:open example',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'name of pipeline', optional: false}
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    let pipeline = yield disambiguate(heroku, context.args.pipeline)
    yield cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
  }))
}
