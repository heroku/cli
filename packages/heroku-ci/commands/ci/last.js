const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const TestRun = require('../../lib/test-run')
const Utils = require('../../lib/utils')

function* run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)
  const lastRun = yield api.latestTestRun(heroku, pipeline.id)

  if (!lastRun) {
    return cli.error('No Heroku CI runs found for this pipeline.')
  }

  return yield TestRun.displayAndExit(pipeline, lastRun.number, { heroku })
}

module.exports = {
  topic: 'ci',
  command: 'last',
  wantsApp: true,
  needsAuth: true,
  description: 'get the results of the last run',
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline'
    }
  ],
  help: 'looks for the most recent run and returns the output of that run',
  run: cli.command(co.wrap(run))
}
