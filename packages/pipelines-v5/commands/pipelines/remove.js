'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

const removeCoupling = require('../../lib/api').removeCoupling

module.exports = {
  topic: 'pipelines',
  command: 'remove',
  description: 'remove this app from its pipeline',
  examples: `$ heroku pipelines:remove -a example-admin
Removing example-admin... done`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    const app = context.app

    yield cli.action(`Removing ${cli.color.app(app)}`, removeCoupling(heroku, app))
  }))
}
