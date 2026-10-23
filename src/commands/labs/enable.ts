import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {accountExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'

import {warnDelinquency} from '../../lib/delinquency.js'
import {createSDK} from '../../lib/sdk.js'

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
    const {platform} = createSDK(this.heroku, {extensions: [accountExtensions]})
    let target: string
    let request

    try {
      await this.heroku.get<Heroku.AccountFeature>(`/account/features/${feature}`)
      request = enableFeature(this.heroku, feature)
      const {account, delinquency} = await platform.account.getWithDelinquency()
      warnDelinquency(this, 'account', delinquency)
      target = color.user(account.email || '')
    } catch (error: any) {
      if (error.http?.statusCode !== 404) throw error
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

async function enableFeature(heroku: APIClient, feature: string, app?: string) {
  return heroku.patch<Heroku.AccountFeature | Heroku.AppFeature>(app ? `/apps/${app}/features/${feature}` : `/account/features/${feature}`, {
    body: {enabled: true},
  })
}
