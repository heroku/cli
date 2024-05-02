'use strict'

const cli = require('@heroku/heroku-cli-util')

module.exports = async function (heroku, addon, force, wait) {
  const {waitForAddonDeprovisioning} = require('./addons_wait')
  const addonName = addon.name

  function destroyAddonRequest(force) {
    return cli.action(
      `Destroying ${cli.color.addon(addonName)} on ${cli.color.app(addon.app.name)}`,
      heroku.delete(`/apps/${addon.app.id}/addons/${addon.id}`, {
        headers: {'Accept-Expansion': 'plan'},
        body: {force},
      }).then(addonResponse => {
        if (addonResponse.state === 'deprovisioning') {
          cli.action.done(cli.color.yellow('pending'))
        }

        return addonResponse
      }).catch(error => {
        if (error.body && error.body.message) {
          throw new Error(`The add-on was unable to be destroyed: ${error.body.message}.`)
        } else {
          throw new Error(`The add-on was unable to be destroyed: ${error}.`)
        }
      }),
    )
  }

  let addonResponse = await destroyAddonRequest(force)

  if (addonResponse.state === 'deprovisioning') {
    if (wait) {
      cli.log(`Waiting for ${cli.color.addon(addonName)}...`)
      addonResponse = await waitForAddonDeprovisioning(heroku, addonResponse, 5)
    } else {
      cli.log(`${cli.color.addon(addonName)} is being destroyed in the background. The app will restart when complete...`)
      cli.log(`Use ${cli.color.cmd('heroku addons:info ' + addonName)} to check destruction progress`)
    }
  } else if (addonResponse.state !== 'deprovisioned') {
    throw new Error(`The add-on was unable to be destroyed, with status ${addonResponse.state}.`)
  }

  return addonResponse
}
