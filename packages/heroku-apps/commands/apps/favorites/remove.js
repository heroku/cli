'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = context.app

  yield cli.action(`Removing ${cli.color.app(app)} from favorites`, co(function * () {
    let favorites = yield heroku.request({host: 'longboard.heroku.com', path: '/favorites', headers: {Range: ''}})
    if (!favorites.find((f) => f.app_name === app)) throw new Error(`${cli.color.app(app)} is not already a favorite app.`)
    yield heroku.request({
      host: 'longboard.heroku.com',
      path: `/favorites/${app}`,
      method: 'DELETE'
    })
  }))
}

module.exports = {
  topic: 'apps',
  command: 'favorites:remove',
  description: 'unfavorites an app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}
