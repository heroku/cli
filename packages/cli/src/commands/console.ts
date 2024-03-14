// tslint:disable:file-name-casing
import {Command, flags} from '@heroku-cli/command'
import {DynoSizeCompletion} from '@heroku-cli/command/lib/completions'
import Dyno from '../lib/run/dyno'
import {buildCommand} from '../lib/run/helpers'

export default class RunConsole extends Command {
  static hidden = true

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    size: flags.string({char: 's', description: 'dyno size', completion: DynoSizeCompletion}),
    env: flags.string({char: 'e', description: 'environment variables to set (use \';\' to split multiple vars)'}),
  }

  async run() {
    const {flags} = await this.parse(RunConsole)

    const opts = {
      heroku: this.heroku,
      app: flags.app,
      command: buildCommand(['console']),
      size: flags.size,
      env: flags.env,
      attach: true,
    }

    const dyno = new Dyno(opts)
    await dyno.start()
  }
}
