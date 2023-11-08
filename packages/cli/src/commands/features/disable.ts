import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

export default class Disable extends Command {
  static description = 'disables an app feature'
  static flags = {
    app: flags.app({required: true}),
  }

  static args = {
    feature: Args.string({required: true}),
  }

  async run() {
    const {flags, args} = await this.parse(Disable)

    const {app} = flags
    const {feature} = args

    ux.action.start(`Disabling ${color.green(feature)} for ${color.app(app)}`)
    const {body: f} = await this.heroku.get<Heroku.AppFeature>(`/apps/${app}/features/${feature}`)
    if (!f.enabled) {
      throw new Error(`${color.red(feature)} is already disabled.`)
    }

    await this.heroku.patch(`/apps/${app}/features/${feature}`, {
      body: {enabled: false},
    })

    ux.action.stop()
  }
}

