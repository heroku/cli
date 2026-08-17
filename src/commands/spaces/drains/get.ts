import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class Get extends Command {
  static aliases = ['drains:get']
  static description = 'display the log drain for a space'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space for which to get log drain', required: true}),
  }
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK()
    const {flags} = await this.parse(Get)
    const {json, space} = flags
    const drain = await platform.spaceLogDrain.info(space)

    if (json) {
      ux.stdout(JSON.stringify(drain, null, 2))
    } else {
      ux.stdout(`${color.info(drain.url)} (${color.name(drain.token)})`)
    }
  }
}
