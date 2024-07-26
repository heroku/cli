import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'
import * as util from './util'
import {waitForAddonProvisioning} from './addons_wait'

function formatConfigVarsMessage(addon: Heroku.AddOn) {
  const configVars = addon.config_vars || []

  if (configVars.length > 0) {
    return `Created ${color.addon(addon.name || '')} as ${configVars.map((c: string) => color.configVar(c)).join(', ')}`
  }

  return `Created ${color.addon(addon.name || '')}`
}

// eslint-disable-next-line max-params
export default async function (
  heroku: APIClient,
  app: string,
  plan: string,
  confirm: string | undefined,
  wait: boolean,
  options: {name?: string, config: Record<string, string | boolean>, as?: string, fork?: string, follow?: string, version?: string},
) {
  async function createAddonRequest(confirmed?: string) {
    const body = {
      confirm: confirmed,
      name: options.name,
      config: options.config,
      plan: {name: plan},
      attachment: {name: options.as},
      fork: options.fork,
      follow: options.follow,
      version: options.version,
    }

    ux.action.start(`Creating ${plan} on ${color.app(app)}`)
    const {body: addon} = await heroku.post<Heroku.AddOn>(`/apps/${app}/addons`, {
      body,
      headers: {
        'accept-expansion': 'plan',
        'x-heroku-legacy-provider-messages': 'true',
      },
    })

    ux.action.stop(color.green(util.formatPriceText(addon.plan?.price || '')))

    return addon
  }

  let addon = await util.trapConfirmationRequired<Heroku.AddOn>(app, confirm, confirm => (createAddonRequest(confirm)))

  if (addon.provision_message) {
    ux.log(addon.provision_message)
  }

  if (addon.state === 'provisioning') {
    if (wait) {
      ux.log(`Waiting for ${color.addon(addon.name || '')}...`)
      addon = await waitForAddonProvisioning(heroku, addon, 5)
      ux.log(formatConfigVarsMessage(addon))
    } else {
      ux.log(`${color.addon(addon.name || '')} is being created in the background. The app will restart when complete...`)
      ux.log(`Use ${color.cmd('heroku addons:info ' + addon.name)} to check creation progress`)
    }
  } else if (addon.state === 'deprovisioned') {
    throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
  } else {
    ux.log(formatConfigVarsMessage(addon))
  }

  return addon
}
