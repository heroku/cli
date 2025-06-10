import {Command, ux} from '@oclif/core'

export default class Prompt extends Command {
  static description = 'interactively prompt for command arguments and flags'

  static examples = [
    '$ heroku apps:info --prompt',
    '$ heroku config:set --prompt',
  ]

  static strict = false

  async run() {
    ux.warn('use `heroku <COMMAND> --prompt` to interactively prompt for command arguments and flags')
  }
}
