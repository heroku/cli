'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let app = context.app
  let feature = context.args.feature

  await cli.action(`Enabling ${cli.color.green(feature)} for ${cli.color.app(app)}`, (async function () {
    let f = await heroku.get(`/apps/${app}/features/${feature}`)
    if (f.enabled) throw new Error(`${cli.color.red(feature)} is already enabled.`)

    await heroku.request({
      path: `/apps/${app}/features/${feature}`,
      method: 'PATCH',
      body: {enabled: true},
    })
  })())
}

module.exports = {
  topic: 'features',
  command: 'enable',
  description: 'enables an app feature',
  args: [{name: 'feature'}],
  needsAuth: true,
  needsApp: true,
  run: cli.command(run),
}
