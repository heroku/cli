const cli = require('heroku-cli-util')
const co = require('co')
const RenderTestRuns = require('../../lib/render-test-runs')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

function * run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)
  return yield RenderTestRuns.render(pipeline, { heroku, watch: context.flags.watch, json: context.flags.json })
}

const cmd = {
  topic: 'ci',
  wantsApp: true,
  needsAuth: true,
  description: 'show the most recent runs',
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline',
      completion: PipelineCompletion
    },
    {
      name: 'watch',
      char: 'w',
      hasValue: false,
      description: 'keep running and watch for new and update tests'
    },
    {
      name: 'json',
      char: 'j',
      hasValue: false,
      description: 'output run info in json format'
    }
  ],
  run: cli.command(co.wrap(run)),
  help: `display the most recent CI runs for the given pipeline

  Example:

    $ heroku ci --app murmuring-headland-14719`
}

module.exports = [
  cmd,
  Object.assign({ command: 'list', hidden: true }, cmd)
]
