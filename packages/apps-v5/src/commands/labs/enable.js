'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  function enableFeature (feature, app) {
    return heroku.request({
      path: app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`,
      method: 'PATCH',
      body: { enabled: true }
    })
  }

  let feature = context.args.feature
  let request
  let target
  try {
    yield heroku.get(`/account/features/${feature}`)
    request = enableFeature(feature)
    target = (yield heroku.get('/account')).email
  } catch (err) {
    if (err.statusCode !== 404) throw err
    // might be an app feature
    if (!context.app) throw err
    yield heroku.get(`/apps/${context.app}/features/${feature}`)
    request = enableFeature(feature, context.app)
    target = context.app
  }

  yield cli.action(`Enabling ${cli.color.green(feature)} for ${cli.color.cyan(target)}`, request)
}

module.exports = {
  topic: 'labs',
  command: 'enable',
  description: 'enables an experimental feature',
  args: [{ name: 'feature' }],
  needsAuth: true,
  wantsApp: true,
  run: cli.command(co.wrap(run))
}
