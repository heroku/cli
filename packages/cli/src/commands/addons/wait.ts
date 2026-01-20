import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {waitForAddonProvisioning, waitForAddonDeprovisioning} from '../../lib/addons/addons_wait.js'
import {resolveAddon} from '../../lib/addons/resolve.js'
import notify from '../../lib/notify.js'
import {ExtendedAddon} from '../../lib/pg/types.js'

export default class Wait extends Command {
  static args = {
    addon: Args.string({description: 'unique identifier or globally unique name of the add-on'}),
  }

  static description = 'show provisioning status of the add-ons on the app'
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    'wait-interval': flags.string({description: 'how frequently to poll in seconds'}),
  }

  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify

  static topic = 'addons'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Wait)
    // TODO: remove this type once the schema is fixed
    type AddonWithDeprovisioningState  = {state?: 'deprovisioning' | ExtendedAddon['state']} & Omit<ExtendedAddon, 'state'>
    let addonsToWaitFor: AddonWithDeprovisioningState[]
    if (args.addon) {
      addonsToWaitFor = [await resolveAddon(this.heroku, flags.app, args.addon)]
    } else if (flags.app) {
      const {body: addons} = await this.heroku.get<AddonWithDeprovisioningState[]>(`/apps/${flags.app}/addons`)
      addonsToWaitFor = addons
    } else {
      const {body: addons} = await this.heroku.get<AddonWithDeprovisioningState[]>('/addons')
      addonsToWaitFor = addons
    }

    addonsToWaitFor = addonsToWaitFor.filter((addon: AddonWithDeprovisioningState) => addon.state === 'provisioning' || addon.state === 'deprovisioning')
    let interval = Number.parseInt(flags['wait-interval'] || '', 10)
    if (!interval || interval < 0) {
      interval = 5
    }

    for (const addon of addonsToWaitFor) {
      const startTime = new Date()
      const addonName: string = addon.name || ''
      if (addon.state === 'provisioning') {
        let addonResponse
        try {
          addonResponse = await waitForAddonProvisioning(this.heroku, addon as Heroku.AddOn, interval)
        } catch (error) {
          Wait.notifier(`heroku addons:wait ${addonName}`, 'Add-on failed to provision', false)
          throw error
        }

        const configVars = (addonResponse.config_vars || [])
        if (configVars.length > 0) {
          const decoratedConfigVars = configVars.map(c => color.name(c))
            .join(', ')
          ux.stdout(`Created ${color.addon(addonName)} as ${decoratedConfigVars}`)
        }

        if (Date.now() - startTime.valueOf() >= 1000 * 5) {
          Wait.notifier(`heroku addons:wait ${addonName}`, 'Add-on successfully provisioned')
        }
      } else if (addon.state === 'deprovisioning') {
        await waitForAddonDeprovisioning(this.heroku, addon as Heroku.AddOn, interval)
        if (Date.now() - startTime.valueOf() >= 1000 * 5) {
          Wait.notifier(`heroku addons:wait ${addonName}`, 'Add-on successfully deprovisioned')
        }
      }
    }
  }
}
