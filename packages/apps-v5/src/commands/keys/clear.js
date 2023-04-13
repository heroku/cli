'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  // eslint-disable-next-line wrap-iife
  await cli.action('Removing all SSH keys', async function () {
    let keys = await heroku.get('/account/keys')
    for (let key of keys) {
      // eslint-disable-next-line no-await-in-loop
      await heroku.request({
        method: 'DELETE',
        path: `/account/keys/${key.id}`,
      })
    }
  }())
}

module.exports = {
  topic: 'keys',
  command: 'clear',
  description: 'remove all SSH keys for current user',
  needsAuth: true,
  run: cli.command(run),
}
