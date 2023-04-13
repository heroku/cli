'use strict'

const cli = require('heroku-cli-util')

module.exports = async function (api, addon, interval) {
  const app = addon.app.name
  const addonName = addon.name

  // eslint-disable-next-line wrap-iife
  await cli.action(`Creating ${cli.color.addon(addon.name)}`, async function () {
    while (addon.state === 'provisioning') {
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise(resolve => setTimeout(resolve, interval * 1000))

      // eslint-disable-next-line no-await-in-loop
      addon = await api.request({
        method: 'GET',
        path: `/apps/${app}/addons/${addonName}`,
        headers: {'Accept-Expansion': 'addon_service,plan'},
      })
    }

    if (addon.state === 'deprovisioned') {
      throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
    }
  }())

  return addon
}
