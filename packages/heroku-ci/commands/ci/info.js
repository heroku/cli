const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const TestRun = require('../../lib/test-run')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  return yield TestRun.displayAndExit(coupling.pipeline, context.args.number, { heroku })
}

module.exports = {
  topic: 'ci',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  args: [
    {
      name: 'number',
      description: 'the test run number to show'
    }
  ],
  description: 'test run information',
  help: 'show the status of a specific test run',
  run: cli.command(co.wrap(run))
}
