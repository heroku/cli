const {Command} = require('heroku-cli-command')
const util = require('../lib/util')

const argv0 = 'heroku'

class Help extends Command {
  async run () {
    let cmd = this.args.find(arg => !['help', '-h', '--help'].includes(arg))
    if (!cmd) return this.topics({argv0})
    let topic = this.plugins.topics[cmd.split(':')[0]]
    let matchedCommand = this.plugins.commands[cmd]
    if (!topic && !matchedCommand) throw new Error(`command ${cmd} not found`)
    let Topic = topic.fetch()
    let commands = Object.keys(this.plugins.commands)
      .map(name => this.plugins.commands[name])
      .filter(c => c.topic === topic.topic)
    commands.sort(util.compare('command'))
    if (typeof Topic !== 'function') {
      Topic = class extends require('heroku-cli-command').Topic {}
      Topic.topic = topic.topic
      Topic.description = topic.description
    }
    topic = new Topic({flags: this.flags})
    await topic.help({commands, args: this.args, matchedCommand, argv0})
  }

  get plugins () {
    return require('../lib/plugins')
  }

  topics ({argv0}) {
    const max = require('lodash.maxby')
    const S = require('string')

    this.log(`Usage: ${this.argv[0]} COMMAND [--app APP] [command-specific-options]

  Help topics, type ${this.color.cmd(argv0 + ' help TOPIC')} for more details:
  `)
    let topics = Object.keys(this.plugins.topics).map(t => this.plugins.topics[t])
    topics = topics.filter(t => !t.hidden)
    topics.sort(util.compare('topic'))
    let maxlength = max(topics, 'topic.length').topic.length
    for (let topic of topics) {
      this.log(`  ${argv0} ${S(topic.topic).padRight(maxlength)}${topic.description ? ' # ' + topic.description : ''}`)
    }

    this.log()
  }
}

Help.topic = 'help'
Help.description = 'display help'
Help.variableArgs = true

module.exports = Help
