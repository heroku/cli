import {Command, flags} from '@heroku-cli/command'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions.js'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../../lib/sdk.js'

export default class Get extends Command {
  static aliases = ['drains:get']
  static description = 'display the log drain for a space'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({
      char: 's', completion: SpaceCompletion, description: 'space for which to get log drain', required: true,
    }),
  }
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {platform} = createSDK(this.heroku)
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
