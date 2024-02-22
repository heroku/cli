import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {resolveAddon} from '../../lib/addons/resolve'
import {waitForAddonProvisioning, waitForAddonDeprovisioning} from '../../lib/addons/addons_wait'
import notify from '../../lib/notify'

export default class Wait extends Command {
    static topic = 'addons';
    static description = 'show provisioning status of the add-ons on the app';
    static flags = {
      'wait-interval': flags.string({description: 'how frequently to poll in seconds'}),
      app: flags.app(),
    };

    static args = {
      addon: Args.string(),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Wait)
      let addonsToWaitFor
      if (args.addon) {
        addonsToWaitFor = [await resolveAddon(this.heroku, flags.app, args.addon)]
      } else if (flags.app) {
        const {body: addons} = await this.heroku.get<Heroku.AddOn[]>(`/apps/${flags.app}/addons`)
        addonsToWaitFor = addons
      } else {
        const {body: addons} = await this.heroku.get<Heroku.AddOn[]>('/addons')
        addonsToWaitFor = addons
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      addonsToWaitFor = addonsToWaitFor.filter((addon: Heroku.AddOn) => addon.state === 'provisioning' || addon.state === 'deprovisioning')
      let interval = Number.parseInt(flags['wait-interval'] || '', 10)
      if (!interval || interval < 0) {
        interval = 5
      }

      for (const addon of addonsToWaitFor) {
        const startTime = new Date()
        const addonName = addon.name
        if (addon.state === 'provisioning') {
          let addonResponse
          try {
            // eslint-disable-next-line no-await-in-loop
            addonResponse = await waitForAddonProvisioning(this.heroku, addon, interval)
          } catch (error) {
            notify(`heroku addons:wait ${addonName}`, 'Add-on failed to provision', false)
            throw error
          }

          const configVars = (addonResponse.config_vars || [])
          if (configVars.length > 0) {
            const decoratedConfigVars = configVars.map(c => color.green(c))
              .join(', ')
            ux.log(`Created ${color.yellow(addonName)} as ${decoratedConfigVars}`)
          }

          if (Date.now() - startTime.valueOf() >= 1000 * 5) {
            notify(`heroku addons:wait ${addonName}`, 'Add-on successfully provisioned')
          }
        } else if (addon.state === 'deprovisioning') {
          // eslint-disable-next-line no-await-in-loop
          await waitForAddonDeprovisioning(this.heroku, addon, interval)
          if (Date.now() - startTime.valueOf() >= 1000 * 5) {
            notify(`heroku addons:wait ${addonName}`, 'Add-on successfully deprovisioned')
          }
        }
      }
    }
}
