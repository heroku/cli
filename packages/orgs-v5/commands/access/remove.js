'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let appName = context.app
  let request = heroku.delete(`/apps/${appName}/collaborators/${context.args.email}`)
  await cli.action(`Removing ${cli.color.cyan(context.args.email)} access from the app ${cli.color.magenta(appName)}`, request)
}

module.exports = [
  {
    topic: 'access',
    needsAuth: true,
    needsApp: true,
    command: 'remove',
    description: 'remove users from a team app',
    example: '$ heroku access:remove user@email.com --app APP',
    args: [{name: 'email', optional: false}],
    run: cli.command(run),
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
    },
  },
]
