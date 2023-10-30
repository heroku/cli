import {Args} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as open from 'open'

export default class AppsInfo extends Command {
  static description = 'show detailed app information'
  static topic = 'apps'
  static aliases = ['info']

  static examples = [
    '$ heroku apps:info',
    '$ heroku apps:info --shell',
  ]

  static flags = {
    shell: flags.boolean({char: 's', description: 'output more shell friendly key/value pairs'}),
    extended: flags.boolean({char: 'x'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  static args = {
    app: Args.string({required: false}),
  }

  async run() {
    const {flags, args} = await this.parse(AppsInfo)
    const appResponse = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const app = appResponse.body
    const path = args.path || ''
    const url = new URL(path, app.web_url)

    await open(url.toString())
  }
}
