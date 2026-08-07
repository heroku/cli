import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {domainExtensions} from '@heroku/sdk/extensions/platform'
import {Args} from '@oclif/core'
import {ux} from '@oclif/core/ux'

export default class DomainsWait extends Command {
  static args = {
    hostname: Args.string({description: 'unique identifier of the domain or full hostname'}),
  }
  static description = 'wait for domain to be active for an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DomainsWait)
    const {platform} = new HerokuSDK({extensions: [domainExtensions]})

    await platform.domain.wait(flags.app, {
      hostname: args.hostname,
      poller: {
        onStart: domain => ux.action.start(`Waiting for ${color.name(domain.hostname || 'domain')}`),
        onStop: () => ux.action.stop(),
      },
    })
  }
}
