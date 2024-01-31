'use strict'

const cli = require('heroku-cli-util')

const grandfatheredPrice = require('../../lib/util').grandfatheredPrice
const formatPrice = require('../../lib/util').formatPrice
const formatState = require('../../lib/util').formatState
const style = require('../../lib/util').style

const run = cli.command({preauth: true}, function (ctx, api) {
  const resolve = require('../../lib/resolve')
  return (async function () {
    const addon = await resolve.addon(api, ctx.app, ctx.args.addon)
    const attachments = await api.request({
      method: 'GET',
      path: `/addons/${addon.id}/addon-attachments`,
    })

    addon.plan.price = grandfatheredPrice(addon)
    addon.attachments = attachments

    cli.styledHeader(style('addon', addon.name))
    cli.styledHash({
      Plan: addon.plan.name,
      Price: formatPrice({price: addon.plan.price, hourly: true}),
      'Max Price': formatPrice({price: addon.plan.price, hourly: false}),
      Attachments: addon.attachments.map(function (att) {
        return [
          style('app', att.app.name),
          style('attachment', att.name),
        ].join('::')
      }).sort(),
      'Owning app': style('app', addon.app.name),
      'Installed at': (new Date(addon.created_at)).toString(),
      State: formatState(addon.state),
    })
  })()
})

const topic = 'addons'

module.exports = {
  topic: topic,
  command: 'info',
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'addon'}],
  run: run,
  usage: `${topic}:info ADDON`,
  description: 'show detailed add-on resource and attachment information',
}
