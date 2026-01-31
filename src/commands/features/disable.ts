import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class Disable extends Command {
  static args = {
    feature: Args.string({description: 'unique identifier or name of the app feature', required: true}),
  }

  static description = 'disables an app feature'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(Disable)

    const {app} = flags
    const {feature} = args

    ux.action.start(`Disabling ${color.name(feature)} for ${color.app(app)}`)
    const {body: f} = await this.heroku.get<Heroku.AppFeature>(`/apps/${app}/features/${feature}`)
    if (!f.enabled) {
      throw new Error(`${color.name(feature)} is already disabled.`)
    }

    await this.heroku.patch(`/apps/${app}/features/${feature}`, {
      body: {enabled: false},
    })

    ux.action.stop()
  }
}
