const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  const couplingPipelineID = coupling.pipeline.id

  yield cli.open(`https://dashboard.heroku.com/pipelines/${couplingPipelineID}/tests`)
}

module.exports = {
  topic: 'ci',
  command: 'open',
  needsApp: true,
  needsAuth: true,
  description: 'open the Dashboard version of Heroku CI',
  help: 'opens a browser to view the Dashboard version of Heroku CI',
  run: cli.command(co.wrap(run))
}
