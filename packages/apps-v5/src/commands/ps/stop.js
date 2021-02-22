'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = context.app
  let dyno = context.args.dyno
  let type = dyno.indexOf('.') !== -1 ? 'ps' : 'type'

  await cli.action(`Stopping ${cli.color.cyan(dyno)} ${type === 'ps' ? 'dyno' : 'dynos'} on ${cli.color.app(app)}`,
    heroku.post(`/apps/${app}/dynos/${dyno}/actions/stop`))
}

let cmd = {
  description: 'stop app dyno',
  help: `
stop app dyno or dyno type`,
  examples: `$ heroku ps:stop run.1828
Stopping run.1828 dyno... done

$ heroku ps:stop run
Stopping run dynos... done`,
  needsAuth: true,
  needsApp: true,
  args: [{ name: 'dyno' }],
  run: cli.command(run)
}

module.exports = [
  Object.assign({}, cmd, { topic: 'ps', command: 'stop' }),
  Object.assign({}, cmd, { topic: 'dyno', command: 'stop' }),
  Object.assign({}, cmd, { topic: 'ps', command: 'kill' }),
  Object.assign({}, cmd, { topic: 'dyno', command: 'kill' }),
  Object.assign({}, cmd, { topic: 'stop', hidden: true }),
  Object.assign({}, cmd, { topic: 'kill', hidden: true })
]
