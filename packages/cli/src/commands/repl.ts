import {Command, ux} from '@oclif/core'

export default class Repl extends Command {
  static description = 'enter an interactive REPL session to run Heroku CLI commands'

  static hidden = true

  static examples = [
    '$ heroku --repl',
  ]

  async run() {
    ux.warn('use `heroku --repl` to enter an interactive REPL session to run Heroku CLI commands')
  }
}
