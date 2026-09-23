import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {dynoExtensions} from '@heroku/sdk/extensions/platform'
import {ConfigVar} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import debug from 'debug'

import {HerokuExec} from '../../lib/ps-exec/exec.js'
import {HerokuSsh} from '../../lib/ps-exec/ssh.js'

export default class Exec extends Command {
  static description = 'Create an SSH session to a dyno'
  static examples = [
    `${color.command('heroku ps:exec --app murmuring-headland-14719')}`,
    `${color.command('heroku ps:exec --app murmuring-headland-14719 -- node -i')}`,
  ]
  static flags = {
    app: flags.app({required: true}),
    dyno: flags.string({
      char: 'd',
      description: 'specify the dyno to connect to',
    }),
    remote: flags.remote(),
    ssh: flags.boolean({
      description: 'use native ssh',
    }),
    status: flags.boolean({
      description: 'lists the status of the SSH server in the dyno',
    }),
  }
  static strict = false
  static topic = 'ps'

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(Exec)
    const {app, dyno, ssh: useNativeSsh, status} = flags

    const context = {
      app,
      args: argv as string[],
      auth: {password: this.heroku.auth},
      flags: {dyno},
    }

    const exec = new HerokuExec()
    const ssh = new HerokuSsh()
    const psExecDebug = debug('cli:ps:exec')

    const {platform} = new HerokuSDK({extensions: [dynoExtensions]})

    await exec.initFeature(context, platform, async (configVars: ConfigVar) => {
      // eslint-disable-next-line unicorn/prefer-ternary
      if (status) {
        await exec.checkStatus(context, platform, configVars)
      } else {
        await exec.updateClientKey(context, platform, configVars, async (privateKey, dyno, credentials) => {
          const message = `Connecting to ${color.name(dyno)} on ${color.app(app)}`
          ux.action.start(message)
          psExecDebug(credentials)
          await (useNativeSsh
            ? ssh.ssh(context, credentials.tunnel_host, credentials.client_user, privateKey, credentials.proxy_public_key)
            : ssh.connect(context, credentials.tunnel_host, credentials.client_user, privateKey, credentials.proxy_public_key)
          )

          ux.action.stop()
        })
      }
    }, 'exec')
  }
}
