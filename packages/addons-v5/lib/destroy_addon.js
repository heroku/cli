'use strict'

const cli = require('heroku-cli-util')

module.exports = async function (heroku, addon, force, wait) {
  const {waitForAddonDeprovisioning} = require('./addons_wait')

  function destroyAddonRequest(force) {
    return cli.action(
      `Destroying ${cli.color.addon(addon.name)} on ${cli.color.app(addon.app.name)}`,
      heroku.delete(`/apps/${addon.app.id}/addons/${addon.id}`, {
        headers: {'Accept-Expansion': 'plan'},
        body: {force},
      }).then(function (addon) {
        if (addon.state === 'deprovisioning') {
          cli.action.done(cli.color.yellow('pending'))
        }

        return addon
      }).catch(error => {
        if (error.body && error.body.message) {
          throw new Error(`The add-on was unable to be destroyed: ${error.body.message}.`)
        } else {
          throw new Error(`The add-on was unable to be destroyed: ${error}.`)
        }
      }),
    )
  }

  addon = await destroyAddonRequest(force)

  if (addon.state === 'deprovisioning') {
    if (wait) {
      cli.log(`Waiting for ${cli.color.addon(addon.name)}...`)
      const deprovision_response = await waitForAddonDeprovisioning(heroku, addon, 5)
      addon = deprovision_response
    } else {
      cli.log(`${cli.color.addon(addon.name)} is being destroyed in the background. The app will restart when complete...`)
      cli.log(`Use ${cli.color.cmd('heroku addons:info ' + addon.name)} to check destruction progress`)
    }
  } else if (addon.state !== 'deprovisioned') {
    throw new Error(`The add-on was unable to be destroyed, with status ${addon.state}.`)
  }

  return addon
}
