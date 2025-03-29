import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'

interface AppUsage {
  addons: Array<{
    id: string;
    meters: {
      [meterLabel: string]: {
        quantity: number
      }
    }
  }>
}

export default class UsageAddons extends Command {
  static topic = 'usage'
  static description = 'list usage values for metered addons associated with a given app'
  static flags = {
    app: flags.app({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(UsageAddons)
    const {app} = flags
    ux.action.start('Gathering usage data')
    const [usageResponse, {body: appAddons}] = await Promise.all([
      this.heroku.get<unknown>(`/apps/${app}/usage`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      }),
      this.heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`),
    ])
    ux.action.stop()
    ux.log()
    const usageApp = usageResponse.body
    const usageData: AppUsage = typeof usageApp === 'string' ? JSON.parse(usageApp) : usageApp
    const usageAddons = usageData.addons

    if (usageAddons.length === 0) {
      ux.log(`No usage found for ${app}`)
      return
    }

    const metersArray = usageAddons.flatMap(addon =>
      Object.entries(addon.meters).map(([label, data]) => ({
        label,
        quantity: data.quantity,
        addonId: addon.id,
      })),
    )

    ux.styledHeader(`Usage for ${color.app(app)}`)
    ux.table(metersArray, {
      Addon: {
        get: row => {
          const matchingAddon = appAddons.find(a => a.id === row.addonId)
          return matchingAddon?.name || row.addonId
        },
      },
      Meter: {
        get: row => row.label,
      },
      Quantity: {
        get: row => row.quantity,
      },
    })
  }
}
