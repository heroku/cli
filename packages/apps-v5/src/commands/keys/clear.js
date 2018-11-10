'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  yield cli.action('Removing all SSH keys', co(function * () {
    let keys = yield heroku.get('/account/keys')
    for (let key of keys) {
      yield heroku.request({
        method: 'DELETE',
        path: `/account/keys/${key.id}`
      })
    }
  }))
}

module.exports = {
  topic: 'keys',
  command: 'clear',
  description: 'remove all SSH keys for current user',
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
