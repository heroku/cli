const {Command} = require('heroku-cli-command')
const plugins = require('../plugins')

function stderrwidth () {
  if (!process.stdout.isTTY) return 80
  return process.stdout.getWindowSize()[0]
}

class Help extends Command {
  async run () {
    plugins.load()
    let cmd = this.argv.slice(1).find(arg => !['help', '-h', '--help'].includes(arg))
    if (!cmd) return this.all()
    let topic = plugins.topics.find(t => t.name === cmd.split(':')[0])
    let command = plugins.commands.find(cmd)
    if (!topic && !command) return this.all()
    this.topic(topic, command, cmd)
  }

  all () {
    const max = require('lodash.maxby')
    const S = require('string')

    this.log(`Usage: ${this.argv[0]} COMMAND [--app APP] [command-specific-options]

  Help topics, type ${this.color.cmd(this.argv[0] + ' help TOPIC')} for more details:
  `)
    let topics = plugins.topics
    topics = topics.filter(t => !t.hidden)
    let maxlength = max(topics, 'name.length').name.length
    for (let topic of topics) {
      this.log(`  ${this.argv[0]} ${S(topic.name).padRight(maxlength)}${topic.description ? ' # ' + topic.description : ''}`)
    }

    this.log()
  }

  topic (topic, command, cmd) {
    const max = require('lodash.maxby')
    const S = require('string')
    const linewrap = require('../linewrap')

    function renderArg (arg) {
      if (arg.required !== false && arg.optional !== true) return ` <${arg.name}>`
      else return ` [${arg.name}]`
    }

    function renderFlags (flags) {
      const max = require('lodash.maxby')
      let lines = []
      for (let flag of flags) {
        let label = []
        if (flag.char) label.push(`-${flag.char}`)
        if (flag.name) label.push(` --${flag.name}`)
        let usage = flag.hasValue ? ` ${flag.name.toUpperCase()}` : ''
        let description = flag.description || ''
        if (flag.required || flag.optional === false) description = `(required) ${description}`
        lines.push([label.join(',').trim() + usage, description])
      }
      let maxLength = max(lines, '0')[0].length
      return lines.map(line => {
        let desc = line[1] || ''
        if (desc) {
          desc = linewrap(maxLength + 4, stderrwidth(), {
            skipScheme: 'ansi-color'
          })(desc).trim()
          desc = ' # ' + desc.split('\n').map(l => {
            if (l[0] !== ' ') return l
            return l.substr(0, maxLength + 1) + ' # ' + l.substr(maxLength + 4)
          }).join('\n')
        }
        return ` ${S(line[0]).padRight(maxLength)}${desc}`
      }).join('\n')
    }

    if (command) {
      let cmd = command.command ? `${command.topic}:${command.command}` : command.topic
      // TODO: get usage if defined
      let usage = `${this.argv[0]} ${cmd}` + (command.args || []).map(renderArg).join('')
      this.log(`Usage: ${this.color.cmd(usage)}\n`)
      if (command.description) this.log(`${command.description.trim()}\n`)
      if (command.flags && command.flags.length) this.log(`${renderFlags(command.flags)}\n`)
      if (command.help) this.log(`${command.help.trim()}\n`)
    }

    if (!topic || topic.name !== cmd) return

    let commands = plugins.commands.filter(c => c.topic === topic.name && c.command)
    if (commands.length === 0) return
    this.log(`${this.argv[0]} ${topic.name} commands: (${this.color.cmd(this.argv[0] + ' help ' + topic.name + ':COMMAND')} for details)
  `)
    let maxLength = max(commands, 'command.length').command.length + topic.name.length + 1
    for (let command of commands) {
      let cmd = command.command ? `${command.topic}:${command.command}` : command.topic
      this.log(`  ${S(cmd).padRight(maxLength)}${command.description ? ' # ' + command.description : ''}`)
    }
    this.log()
  }
}

Help.topic = 'help'
Help.description = 'display help'
Help.variableArgs = true

module.exports = Help
