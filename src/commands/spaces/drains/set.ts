import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

export default class Set extends Command {
  static aliases = ['drains:set']
  static args = {
    url: Args.string({description: 'URL to replace the log drain with', required: true}),
  }
  static description = 'replaces the log drain for a space'
  static flags = {
    space: flags.string({char: 's', description: 'space for which to set log drain', required: true}),
  }
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(Set)
    const {url} = args
    const {space} = flags
    const drain = await platform.spaceLogDrain.update(space, {url})
    ux.stdout(`Successfully set drain ${color.info(drain.url)} for ${color.space(space)}.`)
    ux.warn('It may take a few moments for the changes to take effect.')
  }
}
