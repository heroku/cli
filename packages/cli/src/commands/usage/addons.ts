import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

type AppUsage = {
  addons: {
    id: string;
    meters: {
      storage: {
        quantity: number
      }
    }
  }[]
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
    const [{body: usageResponse}, {body: appAddons}] = await Promise.all([
      this.heroku.get<AppUsage>(`/apps/${app}/usage`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      }),
      this.heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`),
    ])
    const usageAddons = usageResponse.addons
  }
}
