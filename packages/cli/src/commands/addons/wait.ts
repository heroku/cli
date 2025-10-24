import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {resolveAddon} from '../../lib/addons/resolve.js'
import {waitForAddonProvisioning, waitForAddonDeprovisioning} from '../../lib/addons/addons_wait.js'
import notify from '../../lib/notify.js'
import {ExtendedAddon} from '../../lib/pg/types.js'

export default class Wait extends Command {
  static topic = 'addons'
  static description = 'show provisioning status of the add-ons on the app'
  static flags = {
    'wait-interval': flags.string({description: 'how frequently to poll in seconds'}),
    app: flags.app(),
    remote: flags.remote(),
  }

  static args = {
    addon: Args.string({description: 'unique identifier or globally unique name of the add-on'}),
  }

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Wait)
      // TODO: remove this type once the schema is fixed
      type AddonWithDeprovisioningState  = Omit<ExtendedAddon, 'state'> & {state?: ExtendedAddon['state'] | 'deprovisioning'}
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
          notify(`heroku addons:wait ${addonName}`, 'Add-on failed to provision', false)
          throw error
        }

        const configVars = (addonResponse.config_vars || [])
        if (configVars.length > 0) {
          const decoratedConfigVars = configVars.map(c => color.green(c))
            .join(', ')
          ux.stdout(`Created ${color.yellow(addonName)} as ${decoratedConfigVars}`)
        }

        if (Date.now() - startTime.valueOf() >= 1000 * 5) {
          notify(`heroku addons:wait ${addonName}`, 'Add-on successfully provisioned')
        }

        
      } else if (addon.state === 'deprovisioning') {
        await waitForAddonDeprovisioning(this.heroku, addon as Heroku.AddOn, interval)
        if (Date.now() - startTime.valueOf() >= 1000 * 5) {
          notify(`heroku addons:wait ${addonName}`, 'Add-on successfully deprovisioned')
        }
      }  
    }
  }
}
