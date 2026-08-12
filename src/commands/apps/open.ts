import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import open from 'open'

import {sdkClientOptions} from '../../lib/apps/client-options.js'

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
    const {platform} = new HerokuSDK({clientOptions: sdkClientOptions(this.heroku)})
    const {args, flags} = await this.parse(AppsOpen)
    const app = await platform.app.info(flags.app)
    const path = args.path || ''
    const url = new URL(path, app.web_url as string)
    ux.stdout(`Opening ${color.info(url.toString())}...`)
    await open(url.toString())
    return app
  }
}
