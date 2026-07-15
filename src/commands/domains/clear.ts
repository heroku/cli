import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {domainExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

export default class DomainsClear extends Command {
  static description = 'remove all domains from an app'
  static examples = [`${color.command('heroku domains:clear')}`]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(DomainsClear)
    const {platform} = new HerokuSDK({extensions: [domainExtensions]})

    ux.action.start(`Removing all domains from ${color.app(flags.app)}`)
    await platform.domain.clear(flags.app)
    ux.action.stop()
  }
}
