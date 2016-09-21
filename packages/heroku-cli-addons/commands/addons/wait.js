'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let wait = require('co-wait')
let waitForAddonProvisioning = require('../../lib/addons_wait')
let formatState = require('../../lib/util').formatState

let console = cli.console
let isTTY = !console.mocking() && (process.stderr.isTTY) && (process.env.TERM !== 'dumb')

function * waitForOne (ctx, api, addon, interval) {
  addon = yield waitForAddonProvisioning(ctx, api, addon, interval)

  let configVars = (addon.config_vars || [])
  if (configVars.length > 0) {
    configVars = configVars.map(c => cli.color.configVar(c)).join(', ')
    cli.log(`Created ${cli.color.addon(addon.name)} as ${configVars}`)
  }
}

const anyProvisioning = addons => addons.some(addon => addon.state === 'provisioning')

function * waitForMany (ctx, api, app, interval) {
  yield cli.action(`Waiting for add-ons to be created on ${cli.color.app(app)}`, co(function * () {
    let addons, formattedAddons
    let stillProvisioning = true

    while (stillProvisioning) {
      addons = yield api.get(`/apps/${app}/addons`, {headers: {'Accept-Expansion': 'addon_service,plan'}})

      if (isTTY) {
        formattedAddons = addons.map((addon) => {
          return `${cli.color.addon(addon.name)} (${addon.plan.name}) ${formatState(addon.state)}`
        }).join('\n')

        cli.action.status('\n' + formattedAddons)
      }

      yield wait(interval * 1000)

      stillProvisioning = anyProvisioning(addons)
    }
  }))
}

function * run (ctx, api) {
  const resolve = require('../../lib/resolve')

  let interval = parseInt(ctx.flags['wait-interval'])
  if (!interval || interval < 0) { interval = 5 }

  if (ctx.args.addon) {
    let addon = yield resolve.addon(api, ctx.app, ctx.args.addon, {'Accept-Expansion': 'addon_service,plan'})
    yield waitForOne(ctx, api, addon, interval)
  } else {
    yield waitForMany(ctx, api, ctx.app, interval)
  }
}

let topic = 'addons'

module.exports = {
  topic: topic,
  command: 'wait',
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'addon', optional: true}],
  flags: [
    {name: 'interval', char: 'i', description: 'how frequently to poll in seconds', hasValue: true}
  ],
  run: cli.command({preauth: true}, co.wrap(run)),
  usage: `${topic}:wait ADDON`,
  description: 'Show provisioning status of the add-ons on the app'
}
