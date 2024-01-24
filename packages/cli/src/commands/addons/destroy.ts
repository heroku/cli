/* eslint-disable no-await-in-loop */

import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import notify from '../../lib/notify'
import confirmApp from '../../lib/apps/confirm-app'
import destroyAddon from '../../lib/addons/destroy_addon'
import {resolveAddon} from '../../lib/addons/resolve'
import {groupBy} from 'lodash'

export default class Destroy extends Command {
  static topic = 'addons'
  static description = 'permanently destroy an add-on resource'
  static strict = false
  static examples = ['addons:destroy [ADDON]... [flags]']
  static aliases = ['addons:remove']
  static flags = {
    force: flags.boolean({char: 'f', description: 'allow destruction even if connected to other apps'}),
    confirm: flags.string({char: 'c'}),
    wait: flags.boolean({description: 'watch add-on destruction status and exit when complete'}),
    app: flags.app(),
  }

  static args = {
    addonName: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, argv} = await this.parse(Destroy)
    const {app, wait, confirm} = flags
    const force = flags.force || process.env.HEROKU_FORCE === '1'

    const addons = await Promise.all(argv.map(name => resolveAddon(this.heroku, app, name)))
    for (const addon of addons) {
      // prevent deletion of add-on when context.app is set but the addon is attached to a different app
      const addonApp = addon.app.name
      if (app && addonApp !== app) {
        throw new Error(`${color.yellow(addon.name)} is on ${color.magenta(addonApp)} not ${color.magenta(app)}`)
      }
    }

    for (const addonApps of Object.entries(groupBy<Heroku.AddOn>(addons, 'app.name'))) {
      const currentAddons = addonApps[1]
      const appName = addonApps[0]
      await confirmApp(appName, confirm)
      for (const addon of currentAddons) {
        try {
          await destroyAddon(this.heroku, addon, force, wait)
          if (wait) {
            notify(`heroku addons:destroy ${addon.name}`, 'Add-on successfully deprovisioned')
          }
        } catch (error) {
          if (wait) {
            notify(`heroku addons:destroy ${addon.name}`, 'Add-on failed to deprovision', false)
          }

          throw error
        }
      }
    }
  }
}
