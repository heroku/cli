import {Args} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as open from 'open'

export default class AppsOpen extends Command {
  static description = 'open the app in a web browser'
  static topic = 'apps'
  static hiddenAliases = ['open']

  static examples = [
    '$ heroku open -a myapp',
    '$ heroku open -a myapp /foo',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    path: Args.string({required: false}),
  }

  async run() {
    const {flags, args} = await this.parse(AppsOpen)
    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const app = appResponse.body
    const path = args.path || ''
    const url = new URL(path, app.web_url)

    await open(url.toString())
  }
}
