import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'
import _ from 'lodash'

import destroyAddon from '../../lib/addons/destroy_addon.js'
import {resolveAddon} from '../../lib/addons/resolve.js'
import ConfirmCommand from '../../lib/confirmCommand.js'
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

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(Destroy)
    const {app, confirm, wait} = flags
    const force = flags.force || process.env.HEROKU_FORCE === '1'

    const addons = await Promise.all(argv.map((name: string) => resolveAddon(this.heroku, app, name as string)))
    for (const addon of addons) {
      // prevent deletion of add-on when context.app is set but the addon is attached to a different app
      const addonApp = addon.app?.name
      if (app && addonApp !== app) {
        throw new Error(`${color.addon(addon.name ?? '')} is on ${color.app(addonApp ?? '')} not ${color.app(app)}`)
      }
    }

    for (const addonApps of Object.entries(_.groupBy<Heroku.AddOn>(addons, 'app.name'))) {
      const currentAddons = addonApps[1]
      const appName = addonApps[0]
      await new ConfirmCommand().confirm(appName, confirm)
      for (const addon of currentAddons) {
        try {
          await destroyAddon(this.heroku, addon, force, wait)
          if (wait) {
            Destroy.notifier(`heroku addons:destroy ${addon.name}`, 'Add-on successfully deprovisioned')
          }
        } catch (error) {
          if (wait) {
            Destroy.notifier(`heroku addons:destroy ${addon.name}`, 'Add-on failed to deprovision', false)
          }

          throw error
        }
      }
    }
  }
}
