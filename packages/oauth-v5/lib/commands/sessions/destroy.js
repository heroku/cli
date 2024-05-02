'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let id = context.args.id
  await cli.action(`Destroying ${cli.color.cyan(id)}`, (async function () {
    await heroku.request({
      method: 'DELETE',
      path: `/oauth/sessions/${id}`,
    })
  })())
}

module.exports = {
  topic: 'sessions',
  command: 'destroy',
  description: 'delete (logout) OAuth session by ID',
  needsAuth: true,
  args: [{name: 'id'}],
  run: cli.command(run),
}
