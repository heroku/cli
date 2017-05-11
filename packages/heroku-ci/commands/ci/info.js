const cli = require('heroku-cli-util')
const co = require('co')
const TestRun = require('../../lib/test-run')
const Utils = require('../../lib/utils')

function* run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)
  return yield TestRun.displayAndExit(pipeline, context.args.number, { heroku })
}

module.exports = {
  topic: 'ci',
  command: 'info',
  wantsApp: true,
  needsAuth: true,
  args: [
    {
      name: 'number',
      description: 'the test run number to show'
    }
  ],
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline'
    }
  ],
  description: 'test run information',
  help: 'show the status of a specific test run',
  run: cli.command(co.wrap(run))
}
