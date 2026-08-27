import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

export default class Enable extends Command {
  static args = {
    feature: Args.string({description: 'unique identifier or name of the app feature', required: true}),
  }
  static description = 'enables an app feature'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(Enable)

    const {app} = flags
    const {feature} = args

    ux.action.start(`Enabling ${color.name(feature)} for ${color.app(app)}`)
    const f = await platform.appFeature.info(app, feature)
    if (f.enabled) throw new Error(`${color.name(feature)} is already enabled.`)

    await platform.appFeature.update(app, feature, {enabled: true})
    ux.action.stop()
  }
}
