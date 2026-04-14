import * as color from '@heroku/heroku-cli-util/color'
import {Command} from '@oclif/core'

import {HerokuRepl} from '../lib/repl.js'

export default class Repl extends Command {
  static description = 'enter an interactive REPL session to run Heroku CLI commands'
  static examples = [
    color.command('heroku repl'),
  ]
  static hidden = false

  async run() {
    const repl = new HerokuRepl(this.config)
    repl.start()
  }
}
