'use strict'

const cli = require('heroku-cli-util')
const { notify } = require('../../lib/notify')
const waitForAddonProvisioning = require('../../lib/addons_wait')

async function run(ctx, api) {
  const resolve = require('../../lib/resolve')

  let addons
  if (ctx.args.addon) {
    addons = [await resolve.addon(api, ctx.app, ctx.args.addon)]
  } else {
    if (ctx.app) {
      addons = await api.get(`/apps/${ctx.app}/addons`)
    } else {
      addons = await api.get('/addons')
    }
  }
  addons = addons.filter(addon => addon.state === 'provisioning')

  let interval = parseInt(ctx.flags['wait-interval'])
  if (!interval || interval < 0) { interval = 5 }

  for (let addon of addons) {
    const startTime = new Date()
    try {
      addon = await waitForAddonProvisioning(api, addon, interval)
    } catch (error) {
      notify(`heroku addons:wait ${addon.name}`, 'Add-on failed to provision', false)
      throw error
    }

    let configVars = (addon.config_vars || [])
    if (configVars.length > 0) {
      configVars = configVars.map(c => cli.color.configVar(c)).join(', ')
      cli.log(`Created ${cli.color.addon(addon.name)} as ${configVars}`)
    }

    // only show notification if addon took longer than 5 seconds to provision
    if (new Date() - startTime >= 1000 * 5) {
      notify(`heroku addons:wait ${addon.name}`, 'Add-on successfully provisioned')
    }
  }
}

let topic = 'addons'

module.exports = {
  topic: topic,
  command: 'wait',
  wantsApp: true,
  needsAuth: true,
  args: [{ name: 'addon', optional: true }],
  flags: [{ name: 'wait-interval', description: 'how frequently to poll in seconds', hasValue: true }],
  run: cli.command({ preauth: true }, run),
  usage: `${topic}:wait ADDON`,
  description: 'show provisioning status of the add-ons on the app'
}
