const cli = require('heroku-cli-util')
const co = require('co')
const Utils = require('../../lib/utils')

function* run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)
  yield cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}/tests`)
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
      description: 'pipeline'
    }
  ],
  help: 'opens a browser to view the Dashboard version of Heroku CI',
  run: cli.command(co.wrap(run))
}
