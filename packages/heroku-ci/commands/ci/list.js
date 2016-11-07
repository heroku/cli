const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  const pipelineID = coupling.pipeline.id
  const pipelineRepository = yield api.pipelineRepository(heroku, pipelineID)

  cli.styledHeader(`CI settings for ${coupling.pipeline.name}`)
  const output = {
    repository: pipelineRepository.repository.name,
    automatic_test_runs: pipelineRepository.ci
  }

  if (pipelineRepository.organization) {
    output.organization = pipelineRepository.organization.name
  }

  cli.styledHash(output)
}

module.exports = {
  topic: 'ci',
  command: 'list',
  default: true,
  needsApp: true,
  needsAuth: true,
  description: 'CI overview',
  help: 'display CI information for the given pipeline',
  run: cli.command(co.wrap(run))
}
