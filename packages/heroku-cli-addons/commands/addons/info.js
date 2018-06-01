'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

let grandfatheredPrice = require('../../lib/util').grandfatheredPrice
let formatPrice = require('../../lib/util').formatPrice
let formatState = require('../../lib/util').formatState
let style = require('../../lib/util').style

let run = cli.command({preauth: true}, function (ctx, api) {
  const resolve = require('../../lib/resolve')
  return co(function * () {
    let addon = yield resolve.addon(api, ctx.app, ctx.args.addon)
    let [attachments] = yield [
      api.request({
        method: 'GET',
        path: `/addons/${addon.id}/addon-attachments`
      })
    ]

    addon.plan.price = grandfatheredPrice(addon)
    addon.attachments = attachments

    cli.styledHeader(style('addon', addon.name))
    cli.styledHash({
      Plan: addon.plan.name,
      Price: formatPrice(addon.plan.price),
      Attachments: addon.attachments.map(function (att) {
        return [
          style('app', att.app.name),
          style('attachment', att.name)
        ].join('::')
      }).sort(),
      'Owning app': style('app', addon.app.name),
      'Installed at': (new Date(addon.created_at)).toString(),
      'State': formatState(addon.state)
    })
  })
})

let topic = 'addons'
module.exports = {
  topic: topic,
  command: 'info',
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'addon'}],
  run: run,
  usage: `${topic}:info ADDON`,
  description: 'show detailed add-on resource and attachment information'
}
