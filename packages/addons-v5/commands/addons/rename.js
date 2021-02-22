'use strict'

let cli = require('heroku-cli-util')

let run = cli.command({ preauth: true }, function (ctx, api) {
  return async function () {
    let addon = await api.get(`/addons/${ctx.args.addon}`)
    let addonUrl = `/apps/${addon.app.id}/addons/${addon.id}`

    await api.patch(addonUrl, { body: { name: ctx.args.name } })

    let oldName = ctx.args.addon
    let newName = cli.color.magenta(ctx.args.name)

    cli.log(`${oldName} successfully renamed to ${newName}.`)
  }();
})

let topic = 'addons'

module.exports = {
  topic: topic,
  command: 'rename',
  wantsApp: true,
  needsAuth: true,
  args: [{ name: 'addon' }, { name: 'name' }],
  run: run,
  usage: `${topic}:rename ADDON NEW_NAME`,
  description: 'rename an add-on'
}
