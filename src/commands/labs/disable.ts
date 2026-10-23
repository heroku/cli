import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

export default class LabsDisable extends Command {
  static args = {
    feature: Args.string({description: 'unique identifier or name of the account feature', required: true}),
  }
  static description = 'disables an experimental feature'
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
  }

  disableFeature(feature: string, app?: string): Promise<any> {
    return this.heroku.patch(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
      body: {enabled: false},
    })
  }

  async run() {
    const {args, flags} = await this.parse(LabsDisable)
    const {feature} = args
    let request
    let target

    try {
      await this.heroku.get(`/account/features/${feature}`)
      request = this.disableFeature(feature)
      const targetResponse = await this.heroku.get<Heroku.Account>('/account')
      target = color.user(targetResponse.body.email || '')
    } catch (error: any) {
      if (error.http.statusCode !== 404) throw error
      // might be an app feature
      if (!flags.app) throw error
      await this.heroku.get<Heroku.AppFeature>(`/apps/${flags.app}/features/${feature}`)
      request = this.disableFeature(feature, flags.app)
      target = color.app(flags.app)
    }

    ux.action.start(`Disabling ${color.name(feature)} for ${target}`)
    await request
    ux.action.stop()
  }
}
