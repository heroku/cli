const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const RenderTestRuns = require('../../lib/render-test-runs')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)

  return yield RenderTestRuns.render(coupling.pipeline, { heroku, watch: context.flags.watch })
}

module.exports = {
  topic: 'ci',
  command: 'list',
  default: true,
  needsApp: true,
  needsAuth: true,
  description: 'show the most recent runs',
  help: 'display the most recent CI runs for the given pipeline',
  flags: [
    {
      name: 'watch',
      char: 'w',
      hasValue: false,
      description: 'keep running and watch for new and update tests'

    }
  ],
  run: cli.command(co.wrap(run))
}
