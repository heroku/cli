'use strict'

const cli = require('heroku-cli-util')

function formatConfigVarsMessage(addon) {
  let configVars = (addon.config_vars || [])

  if (configVars.length > 0) {
    configVars = configVars.map(c => cli.color.configVar(c)).join(', ')
    return `Created ${cli.color.addon(addon.name)} as ${configVars}`
  }

  return `Created ${cli.color.addon(addon.name)}`
}

module.exports = async function (heroku, app, plan, confirm, wait, options) {
  const util = require('./util')
  const waitForAddonProvisioning = require('./addons_wait')

  function createAddonRequest(confirm) {
    let body = {
      confirm,
      name: options.name,
      config: options.config,
      plan: {name: plan},
      attachment: {name: options.as},
    }

    return cli.action(`Creating ${plan} on ${cli.color.app(app)}`,
      heroku.post(`/apps/${app}/addons`, {
        body,
        headers: {
          'accept-expansion': 'plan',
          'x-heroku-legacy-provider-messages': 'true',
        },
      }).then(function (addon) {
        cli.action.done(cli.color.green(util.formatPrice(addon.plan.price)))
        return addon
      }),
    )
  }

  let addon = await util.trapConfirmationRequired(app, confirm, confirm => (createAddonRequest(confirm)))

  if (addon.provision_message) {
    cli.log(addon.provision_message)
  }

  if (addon.state === 'provisioning') {
    if (wait) {
      cli.log(`Waiting for ${cli.color.addon(addon.name)}...`)
      addon = await waitForAddonProvisioning(heroku, addon, 5)
      cli.log(formatConfigVarsMessage(addon))
    } else {
      cli.log(`${cli.color.addon(addon.name)} is being created in the background. The app will restart when complete...`)
      cli.log(`Use ${cli.color.cmd('heroku addons:info ' + addon.name)} to check creation progress`)
    }
  } else if (addon.state === 'deprovisioned') {
    throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
  } else {
    cli.log(formatConfigVarsMessage(addon))
  }

  return addon
}
