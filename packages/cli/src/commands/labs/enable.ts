import {color} from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

async function enableFeature(heroku: APIClient, feature: string, app?: string) {
  return heroku.patch<Heroku.AccountFeature | Heroku.AppFeature>(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
    body: {enabled: true},
  })
}

export default class LabsEnable extends Command {
  static args = {
    feature: Args.string({description: 'unique identifier or name of the account feature', required: true}),
  }

  static description = 'enables an experimental feature'

  static flags = {
    app: flags.app({required: false}),
    remote: flags.remote(),
  }

  static topic = 'labs'

  async run() {
    const {args, flags} = await this.parse(LabsEnable)
    const {feature} = args
    let target = null
    let request

    try {
      await this.heroku.get<Heroku.AccountFeature>(`/account/features/${feature}`)
      request = enableFeature(this.heroku, feature)
      const targetResponse = await this.heroku.get<Heroku.Account>('/account')
      target = color.user(targetResponse.body.email || '')
    } catch (error: any) {
      if (error.http.statusCode !== 404) throw error
      // might be an app feature
      if (!flags.app) throw error
      await this.heroku.get<Heroku.AppFeature>(`/apps/${flags.app}/features/${feature}`)
      request = enableFeature(this.heroku, feature, flags.app)
      target = color.app(flags.app)
    }

    ux.action.start(`Enabling ${color.name(feature)} for ${target}`)
    await request
    ux.action.stop()
  }
}
