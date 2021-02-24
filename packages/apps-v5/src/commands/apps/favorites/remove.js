'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = context.app

  yield cli.action(`Removing ${cli.color.app(app)} from favorites`, co(function * () {
    let favorites = yield heroku.request({ host: 'particleboard.heroku.com', path: '/favorites?type=app', headers: { Range: '' } })
    let favorite = favorites.find((f) => f.resource_name === app)
    if (!favorite) throw new Error(`${cli.color.app(app)} is not already a favorite app.`)
    yield heroku.request({
      host: 'particleboard.heroku.com',
      path: `/favorites/${favorite.id}`,
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
