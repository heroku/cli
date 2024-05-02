'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  await cli.action('Removing all SSH keys', (async function () {
    let keys = await heroku.get('/account/keys')
    for (let key of keys) {
      await heroku.request({
        method: 'DELETE',
        path: `/account/keys/${key.id}`,
      })
    }
  })())
}

module.exports = {
  topic: 'keys',
  command: 'clear',
  description: 'remove all SSH keys for current user',
  needsAuth: true,
  run: cli.command(run),
}
