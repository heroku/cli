'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const space = context.flags.space
  const team = context.flags.team
  const request = heroku.request({
    method: 'POST',
    path: `/spaces/${space}/transfer`,
    body: { 'new_owner': team }
  })
  try {
    yield cli.action(`Transferring Space ${cli.color.yellow(space)} to Team ${cli.color.green(team)}`, request)
  } catch (err) {
    cli.error(err.body.message)
  }
}

module.exports = {
  topic: 'spaces',
  command: 'transfer',
  description: 'transfers a space',
  help: `Example:

    $ heroku spaces:transfer --space=space-name --team=team-name
    Transferring Space space-name to Team team-name... done
`,
  needsApp: false,
  needsAuth: true,
  flags: [
    { name: 'space', hasValue: true, required: true, description: 'name of space' },
    { name: 'team', hasValue: true, required: true, description: 'desired owner of space' }
  ],
  run: cli.command(co.wrap(run))
}
