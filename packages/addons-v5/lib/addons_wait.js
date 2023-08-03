/* eslint-disable no-await-in-loop */

'use strict'

const cli = require('heroku-cli-util')

module.exports = {
  waitForAddonProvisioning: async function (api, addon, interval) {
    const app = addon.app.name
    const addonName = addon.name
    let addonResponse = {...addon}

    await cli.action(`Creating ${cli.color.addon(addonName)}`, (async function () {
      while (addonResponse.state === 'provisioning') {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise(resolve => setTimeout(resolve, interval * 1000))

        addonResponse = await api.request({
          method: 'GET',
          path: `/apps/${app}/addons/${addonName}`,
          headers: {'Accept-Expansion': 'addon_service,plan'},
        })
      }

      if (addonResponse.state === 'deprovisioned') {
        throw new Error(`The add-on was unable to be created, with status ${addonResponse.state}`)
      }
    })())

    return addonResponse
  },

  waitForAddonDeprovisioning: async function (api, addon, interval) {
    const app = addon.app.name
    const addonName = addon.name
    let addonResponse = {...addon}

    await cli.action(`Destroying ${cli.color.addon(addonName)}`, (async function () {
      while (addonResponse.state === 'deprovisioning') {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise(resolve => setTimeout(resolve, interval * 1000))

        await api.request({
          method: 'GET',
          path: `/apps/${app}/addons/${addonName}`,
          headers: {'Accept-Expansion': 'addon_service,plan'},
        }).then(response => {
          addonResponse = response
        }).catch(function (error) {
          // Not ideal, but API deletes the record returning a 404 when deprovisioned.
          if (error.statusCode === 404) {
            addonResponse.state = 'deprovisioned'
          } else {
            throw error
          }
        })
      }
    })())

    return addonResponse
  },
}
