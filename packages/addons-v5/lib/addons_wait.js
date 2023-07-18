/* eslint-disable no-await-in-loop */

'use strict'

const cli = require('heroku-cli-util')

module.exports = {
  waitForAddonProvisioning: async function (api, addon, interval) {
    const app = addon.app.name
    const addonName = addon.name

    await cli.action(`Creating ${cli.color.addon(addon.name)}`, (async function () {
      while (addon.state === 'provisioning') {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise(resolve => setTimeout(resolve, interval * 1000))

        addon = await api.request({
          method: 'GET',
          path: `/apps/${app}/addons/${addonName}`,
          headers: {'Accept-Expansion': 'addon_service,plan'},
        })
      }

      if (addon.state === 'deprovisioned') {
        throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
      }
    })())

    return addon
  },

  waitForAddonDeprovisioning: async function (api, addon, interval) {
    const app = addon.app.name
    const addonName = addon.name

    await cli.action(`Destroying ${cli.color.addon(addon.name)}`, (async function () {
      while (addon.state === 'deprovisioning') {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise(resolve => setTimeout(resolve, interval * 1000))

        await api.request({
          method: 'GET',
          path: `/apps/${app}/addons/${addonName}`,
          headers: {'Accept-Expansion': 'addon_service,plan'},
        }).then(addonInfo => {
          addon = addonInfo
        }).catch(function (error) {
          // Not ideal, but API deletes the record returning a 404 when deprovisioned.
          if (error.statusCode === 404) {
            addon.state = 'deprovisioned'
          } else {
            throw error
          }
        })
      }
    })())

    return addon
  },
}
