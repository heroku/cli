const {Command} = require('heroku-cli-command')

class NoCommand extends Command {
  async run () {
    throw new Error(`${this.color.yellow(this.argv[1])} is not a heroku command.
Perhaps you meant ????
Run ${this.color.cmd('heroku help')} for a list of available commands.`)
  }
}

NoCommand.variableArgs = true

module.exports = NoCommand
