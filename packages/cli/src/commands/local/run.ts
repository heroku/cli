import {FileCompletion} from '@heroku-cli/command/lib/completions'
import {Command, Flags} from '@oclif/core'
import color from '@heroku-cli/color'
import {fork as foreman} from '../../lib/local/fork-foreman'
import * as fs from 'fs'

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
    }),
  }

  async run() {
    const execArgv: string[] = ['run']
    const {argv, flags} = await this.parse(Run)

    if (argv.length === 0) {
      const errorMessage = 'Usage: heroku local:run [COMMAND]\nMust specify command to run'
      this.error(errorMessage, {exit: -1})
    }

    let envFile = flags.env || '.env'
    envFile = fs.existsSync(envFile) ? envFile : '.env'
    const envFileInfo = fs.statSync(envFile)
    if (!envFileInfo.isFile()) {
      throw new Error(`The specified location for the env file, ${color.bold(envFile)}, is not a file. Please specify a valid file location with the --env flag.`)
    }

    if (flags.env) execArgv.push('--env', envFile)
    if (flags.port) execArgv.push('--port', flags.port)

    execArgv.push('--') // disable node-foreman flag parsing
    execArgv.push(...argv as string[]) // eslint-disable-line unicorn/no-array-push-push

    await foreman(execArgv)
  }
}
