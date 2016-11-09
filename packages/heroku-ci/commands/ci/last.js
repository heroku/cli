const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const TestRun = require('../../lib/test-run')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  const pipeline = coupling.pipeline
  const pipelineID = pipeline.id
  const lastRun = yield api.latestTestRun(heroku, pipelineID)

  if (!lastRun) {
    return cli.error('No Heroku CI runs found for this pipeline.')
  }

  return yield TestRun.displayAndExit(pipeline, lastRun.number, { heroku })
}

module.exports = {
  topic: 'ci',
  command: 'last',
  needsApp: true,
  needsAuth: true,
  description: 'get the results of the last run',
  help: 'looks for the most recent run and returns the output of that run',
  run: cli.command(co.wrap(run))
}
