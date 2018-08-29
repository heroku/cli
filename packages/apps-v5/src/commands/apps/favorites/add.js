'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = context.app

  yield cli.action(`Adding ${cli.color.app(app)} to favorites`, co(function * () {
    let favorites = yield heroku.request({ host: 'particleboard.heroku.com', path: '/favorites?type=app', headers: { Range: '' } })
    if (favorites.find((f) => f.resource_name === app)) throw new Error(`${cli.color.app(app)} is already a favorite app.`)
    yield heroku.request({
      host: 'particleboard.heroku.com',
      path: '/favorites',
      method: 'POST',
      body: { type: 'app', resource_id: app }
    })
  }))
}

module.exports = {
  topic: 'apps',
  command: 'favorites:add',
  description: 'favorites an app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}
