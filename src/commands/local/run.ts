import {color} from '@heroku/heroku-cli-util'
import {Command, Flags} from '@oclif/core'

import {validateEnvFile} from '../../lib/local/env-file-validator.js'
import {fork as foreman} from '../../lib/local/fork-foreman.js'
import {revertSortedArgs} from '../../lib/run/helpers.js'

export default class Run extends Command {
  static description = 'run a one-off command'

  static examples = [
    color.command('heroku local:run bin/migrate'),
  ]

  static flags = {
    env: Flags.string({
      char: 'e',
      description: 'location of env file (defaults to .env)',
    }),
    port: Flags.string({
      char: 'p',
      description: 'port to listen on',
    }),
  }

  static strict = false

  async run() {
    const execArgv: string[] = ['run']
    const {argv, flags} = await this.parse(Run)
    const commandArgs = revertSortedArgs(process.argv, argv as string[])

    if (commandArgs.length === 0) {
      const errorMessage = 'Usage: heroku local:run [COMMAND]\nMust specify command to run'
      this.error(errorMessage, {exit: -1})
    }

    const envFile = validateEnvFile(flags.env, this.warn.bind(this))

    execArgv.push('--env', envFile)
    if (flags.port) execArgv.push('--port', flags.port)

    execArgv.push('--') // disable node-foreman flag parsing
    execArgv.push(...commandArgs as string[]) // eslint-disable-line unicorn/no-array-push-push

    await foreman(execArgv)
  }
}
