import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {dynoExtensions} from '@heroku/sdk/extensions/platform'
import {ConfigVar} from '@heroku/types/3.sdk'
import tsheredoc from 'tsheredoc'

import {HerokuExec} from '../../lib/ps-exec/exec.js'

const heredoc = tsheredoc.default

export default class Socks extends Command {
  static description = 'Launch a SOCKS proxy into a dyno'
  static examples = [heredoc`
    ${color.command('heroku ps:socks --app murmuring-headland-14719')}
    Establishing credentials... done
    SOCKSv5 proxy server started on port 1080
    Use CTRL+C to stop the proxy
  `]
  static flags = {
    app: flags.app({required: true}),
    dyno: flags.string({
      char: 'd',
      description: 'specify the dyno to connect to',
    }),
    remote: flags.remote(),
  }
  static topic = 'ps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Socks)
    const {app, dyno} = flags

    const context = {
      app,
      auth: {password: this.heroku.auth},
      flags: {dyno},
    }

    const exec = new HerokuExec()

    const {platform} = new HerokuSDK({extensions: [dynoExtensions]})

    await exec.initFeature(context, platform, async (configVars: ConfigVar) => {
      await exec.createSocksProxy(context, platform, configVars)
    }, 'socks')

    // Keep the process running until interrupted
    await new Promise<void>(resolve => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
    })
  }
}
