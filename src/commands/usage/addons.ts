import {Command, flags, vars} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import type {Usage} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

interface AppInfo extends Record<string, unknown> {
  id: string
  name: string
}

type PlatformClient = HerokuSDK['platform']

export default class UsageAddons extends Command {
  static description = 'list usage for metered add-ons attached to an app or apps within a team'
  static flags = {
    app: flags.string({char: 'a', description: 'app to list metered add-ons usage for'}),
    team: flags.team({description: 'team to list metered add-ons usage for'}),
  }
  static topic = 'usage'

  public async run(): Promise<void> {
    const {flags} = await this.parse(UsageAddons)
    const {app, team} = flags
    if (!app && !team) {
      ux.error('Specify an app with --app or a team with --team')
    }

    const {platform} = new HerokuSDK({
      clientOptions: {token: this.heroku.auth},
      clientOptionsByService: {
        platform: {baseUrl: vars.apiUrl},
      },
    })

    if (app) {
      await this.fetchAndDisplayAppUsageData(platform, app, team)
    } else if (team) {
      await this.fetchAndDisplayTeamUsageData(platform, team)
    }
  }

  private displayAppUsage(app: string, usageAddons: Usage['addons'], appAddons: Heroku.AddOn[]): void {
    const metersArray = usageAddons.flatMap(addon =>
      Object.entries(addon.meters ?? {}).map(([label, data]) => ({
        addonId: addon.id,
        label,
        quantity: data.quantity,
      })))

    hux.styledHeader(`Usage for ${color.app(app)}`)
    hux.table(metersArray, {
      'Add-on': {
        get(row) {
          const matchingAddon = appAddons.find(a => a.id === row.addonId)
          return matchingAddon?.name || row.addonId || ''
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

  private async fetchAndDisplayAppUsageData(platform: PlatformClient, app: string, team?: string): Promise<void> {
    let usageData: Usage
    let appAddons: Heroku.AddOn[]
    ux.action.start('Gathering usage data')
    if (team) {
      [usageData, appAddons] = await Promise.all([
        platform.usage.forTeamApp(team, app),
        platform.addOn.listByApp(app),
      ])
    } else {
      [usageData, appAddons] = await Promise.all([
        platform.usage.forApp(app),
        platform.addOn.listByApp(app),
      ])
    }

    ux.action.stop()
    ux.stdout()
    const usageAddons = usageData.addons

    if (usageAddons.length === 0) {
      ux.stdout(`No usage found for app ${color.app(app)}`)
      return
    }

    this.displayAppUsage(app, usageAddons, appAddons)
  }

  private async fetchAndDisplayTeamUsageData(platform: PlatformClient, team: string): Promise<void> {
    ux.action.start(`Gathering usage data for ${color.team(team)}`)
    const [usageData, teamAddons] = await Promise.all([
      platform.usage.infoGet(team),
      platform.addOn.listByTeam(team),
    ])

    ux.action.stop()
    ux.stdout()

    if (!usageData.apps || usageData.apps.length === 0) {
      ux.stdout(`No usage found for team ${color.team(team)}`)
      return
    }

    const appInfoArray = this.getAppInfoFromTeamAddons(teamAddons)

    // Display usage for each app
    usageData.apps.forEach(app => {
      const appInfo = appInfoArray.find(info => info.id === app.id)
      this.displayAppUsage(appInfo?.name || app.id || '', app.addons ?? [], teamAddons)
      ux.stdout()
    })
  }

  private getAppInfoFromTeamAddons(teamAddons: Heroku.AddOn[]): AppInfo[] {
    const appInfoMap = new Map<string, string>()
    for (const addon of teamAddons) {
      if (addon.app && addon.app.id && addon.app.name) {
        appInfoMap.set(addon.app.id, addon.app.name)
      }
    }

    return [...appInfoMap.entries()].map(([id, name]) => ({
      id,
      name,
    }))
  }
}
