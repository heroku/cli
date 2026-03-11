import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import fs from 'node:fs'
import * as path from 'node:path'

import {HerokuExec} from '../../lib/ps-exec/exec.js'
import {HerokuSsh} from '../../lib/ps-exec/ssh.js'

export default class Copy extends Command {
  static args = {
    file: Args.string({description: 'file to copy from dyno to local', required: true}),
  }

  static description = 'Copy a file from a dyno to the local filesystem'

  static examples = ['heroku ps:copy FILENAME --app murmuring-headland-14719']

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

    ux.stdout(`Copying ${color.white.bold(src)} to ${color.white.bold(dest)}`)

    if (fs.existsSync(dest)) {
      ux.error(`The local file ${color.white.bold(dest)} already exists`)
    }

    const context = {
      app,
      auth: {password: this.heroku.auth},
      flags: {dyno},
    }

    const exec = new HerokuExec()
    const ssh = new HerokuSsh()

    await exec.initFeature(context, this.heroku, async (configVars: Heroku.ConfigVars) => {
      await exec.updateClientKey(context, this.heroku, configVars, async (privateKey, dyno, response) => {
        const message = `Connecting to ${color.cyan.bold(dyno)} on ${color.app(app)}`
        ux.action.start(message)
        const json = JSON.parse(response.body)
        await ssh.scp(json.tunnel_host, json.client_user, privateKey, json.proxy_public_key, src, dest)
      })
    }, 'copy')
  }
}
