import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args} from '@oclif/core'

export default class DomainsInfo extends Command {
  static args = {
    hostname: Args.string({description: 'unique identifier of the domain or full hostname', required: true}),
  }
  static description = 'show detailed information for a domain on an app'
  static examples = [
    color.command('heroku domains:info www.example.com'),
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DomainsInfo)
    const {platform} = new HerokuSDK()
    const res = await platform.domain.info(flags.app, args.hostname)
    const domain = {
      ...res,
      app: res.app && res.app.name,
    }
    hux.styledObject(domain)
  }
}
