import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

export default class Enable extends Command {
  static description = 'enables an app feature'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    feature: Args.string({required: true, description: 'Unique identifier of app feature or unique name of app feature.'}),
  }

  async run() {
    const {flags, args} = await this.parse(Enable)

    const {app} = flags
    const {feature} = args

    ux.action.start(`Enabling ${color.green(feature)} for ${color.app(app)}`)
    const {body: f} = await this.heroku.get<Heroku.AppFeature>(`/apps/${app}/features/${feature}`)
    if (f.enabled) throw new Error(`${color.red(feature)} is already enabled.`)

    await this.heroku.patch(`/apps/${app}/features/${feature}`, {
      body: {enabled: true},
    })
    ux.action.stop()
  }
}

