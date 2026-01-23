import {color} from '@heroku/heroku-cli-util'
import {Command, ux} from '@oclif/core'

export default class Prompt extends Command {
  static description = 'interactively prompt for command arguments and flags'

  static hidden = true

  static examples = [
    color.command('heroku apps:info --prompt'),
    color.command('heroku config:set --prompt'),
  ]

  static strict = false

  async run() {
    ux.warn('use `heroku <COMMAND> --prompt` to interactively prompt for command arguments and flags')
  }
}
