import color from '@heroku-cli/color'
import {APIClient, flags, Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import {sortBy} from 'lodash'

function enableFeature(heroku: APIClient, feature: Heroku.AppFeature, app?: Heroku.App) {
  return heroku.patch(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
    body: {enabled: true},
  })
}

export default class LabsEnable extends Command {
  static description = 'enables an experimental feature'
  static topic = 'labs'

  static args = {
    app: flags.app({required: false}),
    feature: Args.string({required: false}),
  }

  async run() {
    const {args, flags} = await this.parse(LabsEnable)
    const feature = args.feature
    let request
    let target
    try {
      await this.heroku.get(`/account/features/${feature}`)
      request = enableFeature(this.heroku, feature)
      target = ((await this.heroku.get('/account'))).email
    } catch (error) {
      if (error.http.statusCode !== 404) throw error
      // might be an app feature
      if (!args.app) throw error
      await heroku.get(`/apps/${args.app}/features/${feature}`)
      request = enableFeature(this.heroku, feature, args.app)
      target = args.app
    }

    await cli.action(`Enabling ${color.green(feature)} for ${color.cyan(target)}`, request)
  }
}
