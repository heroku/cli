import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'
const util = require('./util')
const {waitForAddonProvisioning} = require('./addons_wait')

function formatConfigVarsMessage(addon: Heroku.Addon) {
  let configVars = addon.config_vars || []

  if (configVars.length > 0) {
    configVars = configVars.map((c: string) => color.configVar(c)).join(', ')
    return `Created ${color.addon(addon.name)} as ${configVars}`
  }

  return `Created ${color.addon(addon.name)}`
}

export default async function (heroku: APIClient, app, plan, confirm, wait, options) {
  async function createAddonRequest(confirm: string) {
    const body = {
      confirm,
      name: options.name,
      config: options.config,
      plan: {name: plan},
      attachment: {name: options.as},
    }

    ux.action.start(`Creating ${plan} on ${color.app(app)}`)
    const response = await heroku.post<Heroku.AddOn>(`/apps/${app}/addons`, {
      body,
      headers: {
        'accept-expansion': 'plan',
        'x-heroku-legacy-provider-messages': 'true',
      },
    }).then(function ({body: addon}) {
      ux.action.stop(color.green(util.formatPriceText(addon.plan?.price || '')))
      return addon
    })
  }

  let addon = await util.trapConfirmationRequired(app, confirm, confirm => (createAddonRequest(confirm)))

  if (addon.provision_message) {
    ux.log(addon.provision_message)
  }

  if (addon.state === 'provisioning') {
    if (wait) {
      ux.log(`Waiting for ${color.addon(addon.name)}...`)
      addon = await waitForAddonProvisioning(heroku, addon, 5)
      ux.log(formatConfigVarsMessage(addon))
    } else {
      ux.log(`${color.addon(addon.name)} is being created in the background. The app will restart when complete...`)
      ux.log(`Use ${color.cmd('heroku addons:info ' + addon.name)} to check creation progress`)
    }
  } else if (addon.state === 'deprovisioned') {
    throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
  } else {
    ux.log(formatConfigVarsMessage(addon))
  }

  return addon
}
