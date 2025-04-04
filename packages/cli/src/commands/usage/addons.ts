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

interface TeamUsage {
  apps: Array<{
    id: string;
    addons: AppUsage['addons'];
  }>;
}

interface AppInfo extends Record<string, unknown> {
  id: string
  name: string
}

export default class UsageAddons extends Command {
  static topic = 'usage'
  static description = 'list usage values for metered addons associated with a given app or team'
  static flags = {
    app: flags.string(),
    team: flags.string(),
  }

  private displayAppUsage(app: string, usageAddons: AppUsage['addons'], appAddons: Heroku.AddOn[]): void {
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

  private async fetchAndDisplayAppUsageData(app: string, team?: string): Promise<void> {
    let usageData
    let appAddons
    ux.action.start('Gathering usage data')
    if (team) {
      [{body: usageData}, {body: appAddons}] = await Promise.all([
        this.heroku.get<AppUsage>(`/teams/${team}/apps/${app}/usage`, {
          headers: {
            Accept: 'application/vnd.heroku+json; version=3.sdk',
          },
        }),
        this.heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`),
      ])
    } else {
      [{body: usageData}, {body: appAddons}] = await Promise.all([
        this.heroku.get<AppUsage>(`/apps/${app}/usage`, {
          headers: {
            Accept: 'application/vnd.heroku+json; version=3.sdk',
          },
        }),
        this.heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`),
      ])
    }

    ux.action.stop()
    ux.log()
    const usageAddons = usageData.addons

    if (usageAddons.length === 0) {
      ux.log(`No usage found for ${app}`)
      return
    }

    this.displayAppUsage(app, usageAddons, appAddons)
  }

  private async fetchAndDisplayTeamUsageData(team: string): Promise<void> {
    ux.action.start(`Gathering usage data for ${color.magenta(team)}`)
    const [{body: usageData}, {body: teamAddons}] = await Promise.all([
      this.heroku.get<TeamUsage>(`/teams/${team}/usage`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      }),
      this.heroku.get<Heroku.AddOn[]>(`/teams/${team}/addons`),
    ])

    ux.action.stop()
    ux.log()

    if (!usageData.apps || usageData.apps.length === 0) {
      ux.log(`No usage found for team ${team}`)
      return
    }

    const appInfoArray = this.getAppInfoFromTeamAddons(teamAddons)

    // Display usage for each app
    usageData.apps.forEach((app: { id: string; addons: any[] }) => {
      const appInfo = appInfoArray.find(info => info.id === app.id)
      this.displayAppUsage(appInfo?.name || app.id, app.addons, teamAddons)
      ux.log()
    })
  }

  private getAppInfoFromTeamAddons(teamAddons: Heroku.AddOn[]): AppInfo[] {
    const appInfoMap = new Map<string, string>()
    teamAddons.forEach(addon => {
      if (addon.app && addon.app.id && addon.app.name) {
        appInfoMap.set(addon.app.id, addon.app.name)
      }
    })

    return Array.from(appInfoMap.entries()).map(([id, name]) => ({
      id,
      name,
    }))
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(UsageAddons)
    const {app, team} = flags
    if (!app && !team) {
      this.error('Specify an app with --app or a team with --team')
    }

    if (app) {
      await this.fetchAndDisplayAppUsageData(app, team)
    } else if (team) {
      await this.fetchAndDisplayTeamUsageData(team)
    }
  }
}
