import {Args} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import open from 'open'

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
    path: Args.string({required: false, description: 'base URL path of app'}),
  }

  public static urlOpener: (url: string) => Promise<unknown> = open

  async run() {
    const {flags, args} = await this.parse(AppsOpen)
    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const app = appResponse.body
    const path = args.path || ''
    const url = new URL(path, app.web_url)
    // await AppsOpen.urlOpener(url.toString())
    await open(url.toString())
  }
}
