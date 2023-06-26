import {FileCompletion} from '@heroku-cli/command/lib/completions'
import {Command, Flags} from '@oclif/core'

import {fork as foreman} from '../../lib/local/fork-foreman'

export default class Run extends Command {
  static description = 'run a one-off command'

  static examples = [
    '$ heroku local:run bin/migrate',
  ]

  static strict = false

  static flags = {
    env: Flags.string({
      char: 'e',
      completion: FileCompletion,
    }),
    port: Flags.string({
      char: 'p',
      default: '5001',
    }),
  }

  async run() {
    const execArgv: string[] = ['run']
    const {argv, flags} = await this.parse(Run)

    if (argv.length === 0) {
      const errorMessage = 'Usage: heroku local:run [COMMAND]\nMust specify command to run'
      this.error(errorMessage, {exit: -1})
    }

    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)

    execArgv.push('--') // disable node-foreman flag parsing
    execArgv.push(...argv) // eslint-disable-line unicorn/no-array-push-push

    await foreman(execArgv)
  }
}
