'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  await cli.action(`Removing ${cli.color.cyan(context.args.key)} SSH key`, async function () {
    let keys = await heroku.get('/account/keys')
    if (keys.length === 0) throw new Error('No SSH keys on account')
    let toRemove = keys.filter(k => k.comment === context.args.key)
    if (toRemove.length === 0) {
      throw new Error(`SSH Key ${cli.color.red(context.args.key)} not found.
Found keys: ${cli.color.yellow(keys.map(k => k.comment).join(', '))}.`)
    }

    await Promise.all(toRemove.map(key => heroku.request({method: 'DELETE', path: `/account/keys/${key.id}`})))
  }())
}

module.exports = {
  topic: 'keys',
  command: 'remove',
  description: 'remove an SSH key from the user',
  examples: `$ heroku keys:remove email@example.com
Removing email@example.com SSH key... done`,
  needsAuth: true,
  args: [{name: 'key'}],
  run: cli.command(run),
}
