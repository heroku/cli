import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {dynoExtensions} from '@heroku/sdk/extensions/platform'
import {ConfigVar} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import {HerokuExec} from '../../lib/ps-exec/exec.js'
import {HerokuSsh} from '../../lib/ps-exec/ssh.js'

export default class Copy extends Command {
  static args = {
    file: Args.string({description: 'file to copy from dyno to local', required: true}),
  }
  static description = 'Copy a file from a dyno to the local filesystem'
  static examples = [`${color.command('heroku ps:copy FILENAME --app murmuring-headland-14719')}`]
  static flags = {
    app: flags.app({required: true}),
    dyno: flags.string({
      char: 'd',
      description: 'specify the dyno to connect to',
    }),
    output: flags.string({
      char: 'o',
      description: 'the name of the output file',
    }),
    remote: flags.remote(),
  }
  static topic = 'ps'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Copy)
    const {app, dyno, output} = flags
    const src = args.file
    const dest = output || path.basename(src)

    ux.stdout(`Copying ${color.bold(src)} to ${color.bold(dest)}`)

    if (fs.existsSync(dest)) {
      ux.error(`The local file ${color.bold(dest)} already exists`)
    }

    const context = {
      app,
      auth: {password: this.heroku.auth},
      flags: {dyno},
    }

    const exec = new HerokuExec()
    const ssh = new HerokuSsh()

    const {platform} = new HerokuSDK({extensions: [dynoExtensions]})

    await exec.initFeature(context, platform, async (configVars: ConfigVar) => {
      await exec.updateClientKey(context, platform, configVars, async (privateKey, dyno, credentials) => {
        const message = `Connecting to ${color.name(dyno)} on ${color.app(app)}`
        ux.action.start(message)
        await ssh.scp(credentials.tunnel_host, credentials.client_user, privateKey, credentials.proxy_public_key, src, dest)
      })
    }, 'copy')
  }
}
