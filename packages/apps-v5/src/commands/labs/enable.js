'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  function enableFeature(feature, app) {
    return heroku.request({
      path: app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`,
      method: 'PATCH',
      body: {enabled: true},
    })
  }

  let feature = context.args.feature
  let request
  let target
  try {
    await heroku.get(`/account/features/${feature}`)
    request = enableFeature(feature)
    target = ((await heroku.get('/account'))).email
  } catch (error) {
    if (error.statusCode !== 404) throw error
    // might be an app feature
    if (!context.app) throw error
    await heroku.get(`/apps/${context.app}/features/${feature}`)
    request = enableFeature(feature, context.app)
    target = context.app
  }

  await cli.action(`Enabling ${cli.color.green(feature)} for ${cli.color.cyan(target)}`, request)
}

module.exports = {
  topic: 'labs',
  command: 'enable',
  description: 'enables an experimental feature',
  args: [{name: 'feature'}],
  needsAuth: true,
  wantsApp: true,
  run: cli.command(run),
}
