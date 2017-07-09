'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  function disableFeature (feature, app) {
    return heroku.request({
      path: app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`,
      method: 'PATCH',
      body: {enabled: false}
    })
  }

  let feature = context.args.feature
  let request
  let target
  try {
    yield heroku.get(`/account/features/${feature}`)
    request = disableFeature(feature)
    target = (yield heroku.get('/account')).email
  } catch (err) {
    if (err.statusCode !== 404) throw err
    // might be an app feature
    if (!context.app) throw err
    yield heroku.get(`/apps/${context.app}/features/${feature}`)
    request = disableFeature(feature, context.app)
    target = context.app
  }

  yield cli.action(`Disabling ${cli.color.green(feature)} for ${cli.color.cyan(target)}`, request)
}

module.exports = {
  topic: 'labs',
  command: 'disable',
  description: 'disables an experimental feature',
  args: [{name: 'feature'}],
  needsAuth: true,
  wantsApp: true,
  run: cli.command(co.wrap(run))
}
