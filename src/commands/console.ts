
import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion} from '@heroku-cli/command/lib/completions.js'

import Dyno from '../lib/run/dyno.js'
import {buildCommand} from '../lib/run/helpers.js'

export default class RunConsole extends Command {
  static flags = {
    app: flags.app({required: true}),
    env: flags.string({char: 'e', description: 'environment variables to set (use \';\' to split multiple vars)'}),
    remote: flags.remote(),
    size: flags.string({char: 's', completion: DynoSizeCompletion, description: 'dyno size'}),
  }
  static hidden = true

  async run() {
    const {flags} = await this.parse(RunConsole)

    const opts = {
      app: flags.app,
      attach: true,
      command: buildCommand(['console']),
      env: flags.env,
      heroku: this.heroku,
      size: flags.size,
    }

    const dyno = new Dyno(opts)
    await dyno.start()
  }
}
