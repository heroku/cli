import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {Args} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class AppsOpen extends Command {
  static args = {
    path: Args.string({description: 'base URL path of app', required: false}),
  }
  static description = 'open the app in a web browser'
  static examples = [
    color.command('heroku open -a myapp'),
    color.command('heroku open -a myapp /foo'),
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['open']
  static topic = 'apps'

  async run() {
    const {platform} = createSDK(this.heroku)
    const {args, flags} = await this.parse(AppsOpen)
    const app = await platform.app.info(flags.app)
    const path = args.path || ''
    const url = new URL(path, app.web_url as string)
    if (!await hux.openUrl(url.toString(), {prompt: false})) this.exit(1)
    return app
  }
}
