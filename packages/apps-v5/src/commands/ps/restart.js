'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = context.app
  let dyno = context.args.dyno

  let msg = 'Restarting'
  if (dyno) msg += ` ${cli.color.cyan(dyno)}`
  msg += (dyno && dyno.indexOf('.') !== -1) ? ' dyno' : ' dynos'
  msg += ` on ${cli.color.app(app)}`

  await cli.action(msg, async function () {
    await heroku.delete(dyno ? `/apps/${app}/dynos/${encodeURIComponent(dyno)}` : `/apps/${app}/dynos`)
  }())
}

let cmd = {
  description: 'restart app dynos',
  help: 'if DYNO is not specified, restarts all dynos on app',
  examples: `$ heroku ps:restart web.1
Restarting web.1 dyno... done

$ heroku ps:restart web
Restarting web dynos... done

$ heroku ps:restart
Restarting dynos... done`,
  needsAuth: true,
  needsApp: true,
  args: [{ name: 'dyno', optional: true }],
  run: cli.command(run)
}

module.exports = [
  Object.assign({ topic: 'ps', command: 'restart' }, cmd),
  Object.assign({ topic: 'dyno', command: 'restart' }, cmd),
  Object.assign({ topic: 'restart', hidden: true }, cmd)
]
