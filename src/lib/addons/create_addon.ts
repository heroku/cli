import {color, utils} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {waitForAddonProvisioning} from './addons_wait.js'
import * as util from './util.js'

function formatConfigVarsMessage(addon: Heroku.AddOn) {
  const configVars = addon.config_vars || []

  if (configVars.length > 0) {
    return `Created ${color.addon(addon.name || '')} as ${configVars.map((c: string) => color.name(c)).join(', ')}`
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
  options: {
    actionStartMessage?: string,
    actionStopMessage?: string,
    as?: string,
    config: Record<string, boolean | string | undefined>,
    name?: string,
  },
) {
  async function createAddonRequest(confirmed?: string) {
    const body = {
      attachment: {name: options.as},
      config: options.config,
      confirm: confirmed,
      name: options.name,
      plan: {name: plan},
    }

    ux.action.start(options.actionStartMessage || `Creating ${plan} on ${color.app(app)}`)
    const {body: addon} = await heroku.post<Heroku.AddOn>(`/apps/${app}/addons`, {
      body,
      headers: {
        'accept-expansion': 'plan',
        'x-heroku-legacy-provider-messages': 'true',
      },
    })

    ux.action.stop(options.actionStopMessage || color.green(util.formatPriceText(addon.plan?.price || '')))

    return addon
  }

  let addon = await util.trapConfirmationRequired<Heroku.AddOn>(app, confirm, confirm => (createAddonRequest(confirm)))

  if (addon.provision_message) {
    ux.stdout(addon.provision_message)
  }

  if (addon.state === 'provisioning') {
    if (wait) {
      ux.stdout(`Waiting for ${color.addon(addon.name || '')}...`)
      addon = await waitForAddonProvisioning(heroku, addon, 5)
      ux.stdout(formatConfigVarsMessage(addon))
    } else {
      ux.stdout(`${color.addon(addon.name || '')} is being created in the background. The app will restart when complete...`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (utils.pg.isAdvancedDatabase(addon as any))
        ux.stdout(`Run ${color.code('heroku data:pg:info ' + addon.name + ' -a ' + addon.app!.name)} to check creation progress.`)
      else
        ux.stdout(`Run ${color.code('heroku addons:info ' + addon.name)} to check creation progress.`)
    }
  } else if (addon.state === 'deprovisioned') {
    throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
  } else {
    ux.stdout(formatConfigVarsMessage(addon))
  }

  return addon
}
