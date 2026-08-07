import type {AddOn} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import {color, pg, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {AddonProvisioningFailedError} from '@heroku/sdk/resources/platform/add-on'
import {Args} from '@oclif/core'
import {ux} from '@oclif/core/ux'
import _ from 'lodash'

import ConfirmCommand from '../../lib/confirm-command.js'
import notify from '../../lib/notify.js'

export default class Destroy extends Command {
  static args = {
    addonName: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }
  static description = 'permanently destroy an add-on resource'
  static examples = [`${color.command('addons:destroy [ADDON]... [flags]')}`]
  static flags = {
    app: flags.app(),
    confirm: flags.string({char: 'c'}),
    force: flags.boolean({char: 'f', description: 'allow destruction even if connected to other apps'}),
    remote: flags.remote(),
    wait: flags.boolean({description: 'watch add-on destruction status and exit when complete'}),
  }
  static hiddenAliases = ['addons:remove']
  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify
  static strict = false
  static topic = 'addons'

  public async run(): Promise<AddOn[]> {
    const {argv, flags} = await this.parse(Destroy)
    const {app, confirm, wait} = flags
    const force = flags.force || process.env.HEROKU_FORCE === '1'
    const addonResolver = new utils.AddonResolver(this.heroku)
    const {platform} = new HerokuSDK({extensions: [addOnExtensions]})

    const addons = await Promise.all(argv.map((name: string) => addonResolver.resolve(name as string, app)))
    for (const addon of addons) {
      // prevent deletion of add-on when context.app is set but the addon is attached to a different app
      const addonApp = addon.app?.name
      if (app && addonApp !== app) {
        throw new Error(`${color.addon(addon.name ?? '')} is on ${color.app(addonApp ?? '')} not ${color.app(app)}`)
      }
    }

    const destroyed: AddOn[] = []
    for (const addonApps of Object.entries(_.groupBy(addons, 'app.name'))) {
      const currentAddons = addonApps[1]
      const appName = addonApps[0]
      await new ConfirmCommand().confirm(appName, confirm)
      for (const addon of currentAddons) {
        const addonName = addon.name ?? ''
        const appIdentity = addon.app?.name ?? ''
        try {
          ux.action.start(`Destroying ${color.addon(addonName)} on ${color.app(appIdentity)}`)
          const result = await platform.addOn.destroyAndWait(appIdentity, addonName, {
            force,
            onDeprovisioning() {
              // Two-phase UX: stop the "Destroying … on <app>" spinner as pending,
              // then surface a dedicated wait spinner while the SDK polls.
              ux.action.stop(color.info('pending'))
              ux.stdout(`Waiting for ${color.addon(addonName)}...`)
              ux.action.start(`Destroying ${color.addon(addonName)}`)
            },
            wait,
          })

          const resultState = result.state as string
          if (resultState === 'deprovisioning') {
            // Async deprovisioning without --wait: leave the destruction running in the background.
            ux.action.stop(color.info('pending'))
            ux.stdout(`${color.addon(addonName)} is being destroyed in the background. The app will restart when complete...`)
            ux.stdout(`Run ${color.code('heroku addons:info ' + addonName)} to check destruction progress`)
          } else if (resultState === 'deprovisioned') {
            ux.action.stop()
          } else {
            // A synchronous delete that settled into an unexpected terminal state.
            ux.action.stop()
            throw new AddonProvisioningFailedError(result)
          }

          if (wait) {
            Destroy.notifier(`heroku addons:destroy ${addonName}`, 'Add-on successfully deprovisioned')
          }

          destroyed.push(result)
        } catch (error) {
          if (wait) {
            Destroy.notifier(`heroku addons:destroy ${addonName}`, 'Add-on failed to deprovision', false)
          }

          throw this.toDestroyError(addon, error)
        }
      }
    }

    return destroyed
  }

  // The SDK's destroyAndWait surfaces platform/HTTP errors verbatim; the CLI owns the
  // friendly "can't destroy your database" / "add-on was unable to be destroyed" copy.
  private toDestroyError(addon: pg.ExtendedAddon, error: unknown): Error {
    const isAdvancedDatabase = utils.pg.isAdvancedDatabase(addon)

    if (error instanceof AddonProvisioningFailedError) {
      const {state} = error.addon
      return isAdvancedDatabase
        ? new Error(`You can't destroy a database with a ${state} status.`)
        : new Error(`The add-on was unable to be destroyed, with status ${state}.`)
    }

    const errorMessage = (error instanceof Error ? error.message : undefined) ?? error
    return isAdvancedDatabase
      ? new Error(`We can't destroy your database due to an error: ${errorMessage}. Try again or open a ticket with Heroku Support: https://help.heroku.com/`)
      : new Error(`The add-on was unable to be destroyed: ${errorMessage}.`)
  }
}
