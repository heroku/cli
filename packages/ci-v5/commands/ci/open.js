const cli = require('@heroku/heroku-cli-util')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

async function run(context, heroku) {
  const pipeline = await Utils.getPipeline(context, heroku)
  await cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}/tests`)
}

module.exports = {
  topic: 'ci',
  command: 'open',
  wantsApp: true,
  needsAuth: true,
  description: 'open the Dashboard version of Heroku CI',
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline',
      completion: PipelineCompletion,
    },
  ],
  help: `opens a browser to view the Dashboard version of Heroku CI

    Example:

    $ heroku ci:open --app murmuring-headland-14719`,
  run: cli.command(run),
}
