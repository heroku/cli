import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

export default class DomainsInfo extends Command {
  static description = 'show detailed information for a domain on an app'

  static examples = [
    '$ heroku domains:info www.example.com',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    hostname: Args.string({required: true, description: 'unique identifier of the domain or full hostname'}),
  }

  async run() {
    const {args, flags} = await this.parse(DomainsInfo)
    const {body: res} = await this.heroku.get<Heroku.Domain>(`/apps/${flags.app}/domains/${args.hostname}`)
    const domain = {
      ...res,
      app: res.app && res.app.name,
    }
    hux.styledObject(domain)
  }
}
