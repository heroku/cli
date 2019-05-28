import {Command, flags} from '@oclif/command'
import  { FileCompletion } from '@heroku-cli/command/lib/completions';
import foreman from '../../fork_foreman';

export default class Run extends Command {
  static description = 'run a one-off command'

  static examples = [
    '$ heroku local:run bin/migrate'
  ]

  static strict = false

  static flags = {
    env: flags.string({
      char: 'e',
      completion: FileCompletion
    }),
    port: flags.string({
      char: 'p'
    })
  }

  async run() {
    const execArgv: string[] = ['run']
    const {argv, flags} = this.parse(Run)

    if (argv.length < 1) {
      const errorMessage = 'Usage: heroku local:run [COMMAND]\nMust specify command to run';
      this.error(errorMessage, { exit: -1 })
    }

    if (flags.env) execArgv.push('--env', flags.env)
    if (flags.port) execArgv.push('--port', flags.port)

    execArgv.push('--') // disable node-foreman flag parsing
    execArgv.push(...argv)

    await foreman(execArgv);
  }
}
