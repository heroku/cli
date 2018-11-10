'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let to = context.flags.to
  let from = context.flags.from
  let request = heroku.request({
    method: 'PATCH',
    path: `/spaces/${from}`,
    body: { name: to }
  })
  yield cli.action(`Renaming space from ${cli.color.cyan(from)} to ${cli.color.green(to)}`, request)
}

module.exports = {
  topic: 'spaces',
  command: 'rename',
  description: 'renames a space',
  help: `Example:

    $ heroku spaces:rename --from old-space-name --to new-space-name
    Renaming space old-space-name to new-space-name... done
`,
  needsApp: false,
  needsAuth: true,
  flags: [
    { name: 'from', hasValue: true, required: true, description: 'current name of space' },
    { name: 'to', hasValue: true, required: true, description: 'desired name of space' }
  ],
  run: cli.command(co.wrap(run))
}
