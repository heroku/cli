import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import open from 'open'

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
    const {args, flags} = await this.parse(AppsOpen)
    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const app = appResponse.body
    const path = args.path || ''
    const url = new URL(path, app.web_url)
    ux.stdout(`Opening ${color.info(url.toString())}...`)
    await open(url.toString())
  }
}
