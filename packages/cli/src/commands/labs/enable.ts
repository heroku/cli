import color from '@heroku-cli/color'
import {APIClient, Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

function enableFeature(heroku: APIClient, feature: string, app?: string) {
  return heroku.patch<Heroku.AppFeature | Heroku.AccountFeature>(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
    body: {enabled: true},
  })
}

export default class LabsEnable extends Command {
  static description = 'enables an experimental feature'
  static topic = 'labs'

  static args = {
    app: Args.string({required: false}),
    feature: Args.string({required: true}),
  }

  async run() {
    const {args} = await this.parse(LabsEnable)
    const feature = args.feature
    let target

    try {
      await this.heroku.get<Heroku.AccountFeature>(`/account/features/${feature}`)
      enableFeature(this.heroku, feature)
      const targetResponse = await this.heroku.get<Heroku.Account>('/account')
      target = targetResponse.body.email
    } catch (error: any) {
      if (error.http.statusCode !== 404) throw error
      // might be an app feature
      if (!args.app) throw error
      await this.heroku.get<Heroku.AppFeature>(`/apps/${args.app}/features/${feature}`)
      enableFeature(this.heroku, feature, args.app)
      target = args.app
    }

    ux.action.start(`Enabling ${color.green(feature)} for ${color.cyan(target!)}`)
    ux.action.stop()
  }
}
