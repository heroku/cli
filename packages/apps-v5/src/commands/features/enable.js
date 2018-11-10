'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = context.app
  let feature = context.args.feature

  yield cli.action(`Enabling ${cli.color.green(feature)} for ${cli.color.app(app)}`, co(function * () {
    let f = yield heroku.get(`/apps/${app}/features/${feature}`)
    if (f.enabled) throw new Error(`${cli.color.red(feature)} is already enabled.`)

    yield heroku.request({
      path: `/apps/${app}/features/${feature}`,
      method: 'PATCH',
      body: { enabled: true }
    })
  }))
}

module.exports = {
  topic: 'features',
  command: 'enable',
  description: 'enables an app feature',
  args: [{ name: 'feature' }],
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}
