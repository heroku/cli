const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const WatchTestRuns = require('../../lib/watch-test-runs')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  return yield WatchTestRuns.watch(coupling.pipeline, { heroku })
}

module.exports = {
  topic: 'ci',
  command: 'watch',
  needsApp: true,
  needsAuth: true,
  description: 'watch in flight tests runs',
  help: 'a long running command which will watch all running test runs',
  run: cli.command(co.wrap(run))
}
