/* eslint-disable no-await-in-loop */

'use strict'

const cli = require('heroku-cli-util')
const {notify} = require('../../lib/notify')
const {waitForAddonProvisioning, waitForAddonDeprovisioning} = require('../../lib/addons_wait')

async function run(ctx, api) {
  const resolve = require('../../lib/resolve')

  let addons
  if (ctx.args.addon) {
    addons = [await resolve.addon(api, ctx.app, ctx.args.addon)]
  } else if (ctx.app) {
    addons = await api.get(`/apps/${ctx.app}/addons`)
  } else {
    addons = await api.get('/addons')
  }

  addons = addons.filter(addon => addon.state === 'provisioning' || addon.state === 'deprovisioning')

  let interval = Number.parseInt(ctx.flags['wait-interval'], 10)
  if (!interval || interval < 0) {
    interval = 5
  }

  for (const addon of addons) {
    const startTime = new Date()
    const addonName = addon.name

    if (addon.state === 'provisioning') {
      let addonResponse
      try {
        addonResponse = await waitForAddonProvisioning(api, addon, interval)
      } catch (error) {
        notify(`heroku addons:wait ${addonName}`, 'Add-on failed to provision', false)
        throw error
      }

      const configVars = (addonResponse.config_vars || [])

      if (configVars.length > 0) {
        const decoratedConfigVars = configVars.map(c => cli.color.configVar(c)).join(', ')
        cli.log(`Created ${cli.color.addon(addonName)} as ${decoratedConfigVars}`)
      }

      // only show notification if addon took longer than 5 seconds to provision
      if (Date.now() - startTime >= 1000 * 5) {
        notify(`heroku addons:wait ${addonName}`, 'Add-on successfully provisioned')
      }
    } else if (addon.state === 'deprovisioning') {
      await waitForAddonDeprovisioning(api, addon, interval)

      // only show notification if addon took longer than 5 seconds to deprovision
      if (Date.now() - startTime >= 1000 * 5) {
        notify(`heroku addons:wait ${addonName}`, 'Add-on successfully deprovisioned')
      }
    }
  }
}

let topic = 'addons'

module.exports = {
  topic: topic,
  command: 'wait',
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'addon', optional: true}],
  flags: [{name: 'wait-interval', description: 'how frequently to poll in seconds', hasValue: true}],
  run: cli.command({preauth: true}, run),
  usage: `${topic}:wait ADDON`,
  description: 'show provisioning status of the add-ons on the app',
}
