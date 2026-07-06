import * as Heroku from '@heroku-cli/schema'
import {color, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {AddonConfirmationRequiredError} from '@heroku/sdk/resources/platform/add-on'
import {ux} from '@oclif/core/ux'

import ConfirmCommand from '../confirm-command.js'
import * as util from './util.js'

function formatConfigVarsMessage(addon: Heroku.AddOn) {
  const configVars = addon.config_vars || []

  if (configVars.length > 0) {
    return `Created ${color.addon(addon.name || '')} as ${configVars.map((c: string) => color.name(c)).join(', ')}`
  }

  return `Created ${color.addon(addon.name || '')}`
}

// eslint-disable-next-line max-params
export default async function createAddon(
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
): Promise<Heroku.AddOn> {
  const {platform} = new HerokuSDK({extensions: [addOnExtensions]})
  const buildBody = (confirmed?: string) => ({
    attachment: {name: options.as},
    config: options.config as Record<string, string>,
    confirm: confirmed,
    name: options.name,
    plan,
  })

  // Two-phase UX during a wait: the first ux.action shows
  // "Creating <plan>... <price>" wrapping the initial create call.
  // onProvisioning closes that, prints provision_message + "Waiting"
  // to stdout, then opens a second ux.action ("Creating <addonName>")
  // that wraps the poll loop and is closed after createAndWait returns.
  let inWaitPhase = false
  const onProvisioning = (created: Heroku.AddOn) => {
    ux.action.stop(options.actionStopMessage || color.green(util.formatPriceText(created.plan?.price || '')))
    if (created.provision_message) {
      ux.stdout(created.provision_message)
    }

    ux.stdout(`Waiting for ${color.addon(created.name || '')}...`)
    ux.action.start(`Creating ${color.addon(created.name || '')}`)
    inWaitPhase = true
  }

  async function callCreateAndWait(confirmed?: string): Promise<Heroku.AddOn> {
    return (await platform.addOn.createAndWait(
      app,
      buildBody(confirmed),
      {onProvisioning, wait},
    )) as Heroku.AddOn
  }

  ux.action.start(options.actionStartMessage || `Creating ${plan} on ${color.app(app)}`)
  let addon: Heroku.AddOn
  try {
    try {
      addon = await callCreateAndWait(confirm)
    } catch (error) {
      if (error instanceof AddonConfirmationRequiredError) {
        ux.action.stop(color.red('!'))
        await new ConfirmCommand().confirm(app, confirm, error.message)
        ux.action.start(options.actionStartMessage || `Creating ${plan} on ${color.app(app)}`)
        addon = await callCreateAndWait(app)
      } else {
        throw error
      }
    }
  } catch (error) {
    ux.action.stop(color.red('!'))
    throw error
  }

  if (inWaitPhase) {
    // Closes the wait-phase action started in onProvisioning.
    ux.action.stop()
    ux.stdout(formatConfigVarsMessage(addon))
  } else {
    // No two-phase: close the create-phase action with the price line.
    ux.action.stop(options.actionStopMessage || color.green(util.formatPriceText(addon.plan?.price || '')))

    if (addon.provision_message) {
      ux.stdout(addon.provision_message)
    }

    if (addon.state === 'provisioning') {
      // wait was false; surface guidance for the user to check progress.
      ux.stdout(`${color.addon(addon.name || '')} is being created in the background. The app will restart when complete...`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (utils.pg.isAdvancedDatabase(addon as any))
        ux.stdout(`Run ${color.code('heroku data:pg:info ' + addon.name + ' -a ' + addon.app!.name)} to check creation progress.`)
      else
        ux.stdout(`Run ${color.code('heroku addons:info ' + addon.name)} to check creation progress.`)
    } else {
      ux.stdout(formatConfigVarsMessage(addon))
    }
  }

  return addon
}
