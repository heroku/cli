'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let app = context.app

  await cli.action(`Adding ${cli.color.app(app)} to favorites`, (async function () {
    let favorites = await heroku.request({host: 'particleboard.heroku.com', path: '/favorites?type=app', headers: {Range: ''}})
    if (favorites.find(f => f.resource_name === app)) throw new Error(`${cli.color.app(app)} is already a favorite app.`)
    await heroku.request({
      host: 'particleboard.heroku.com',
      path: '/favorites',
      method: 'POST',
      body: {type: 'app', resource_id: app},
    })
  })())
}

module.exports = {
  topic: 'apps',
  command: 'favorites:add',
  description: 'favorites an app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(run),
}
