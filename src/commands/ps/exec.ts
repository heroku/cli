import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
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

    await exec.initFeature(context, this.heroku, async (configVars: Heroku.ConfigVars) => {
      if (status) {
        await exec.checkStatus(context, this.heroku, configVars)
      } else {
        await exec.updateClientKey(context, this.heroku, configVars, async (privateKey, dyno, response) => {
          const message = `Connecting to ${color.cyan.bold(dyno)} on ${color.app(app)}`
          ux.action.start(message)
          psExecDebug(response.body)
          const json = JSON.parse(response.body)
          if (useNativeSsh) {
            await ssh.ssh(context, json.tunnel_host, json.client_user, privateKey, json.proxy_public_key)
          } else {
            await ssh.connect(context, json.tunnel_host, json.client_user, privateKey, json.proxy_public_key)
          }

          ux.action.stop()
        })
      }
    }, 'exec')
  }
}
