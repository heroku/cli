'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let appName = context.app
  let request = heroku.delete(`/apps/${appName}/collaborators/${context.args.email}`)
  yield cli.action(`Removing ${cli.color.cyan(context.args.email)} access from the app ${cli.color.magenta(appName)}`, request)
}

module.exports = [
  {
    topic: 'access',
    needsAuth: true,
    needsApp: true,
    command: 'remove',
    description: 'Remove users from your app',
    help: `Example:

    heroku access:remove user@email.com --app APP`,
    args: [{name: 'email', optional: false}],
    run: cli.command(co.wrap(run))
  },
  {
    topic: 'sharing',
    command: 'remove',
    help: 'this command is now heroku access:remove',
    variableArgs: true,
    hidden: true,
    run: () => {
      cli.error(`This command is now ${cli.color.cyan('heroku access:remove')}`)
      process.exit(1)
    }
  }
]
