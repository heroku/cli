'use strict'

const cli = require('heroku-cli-util')
const S = require('string')
const flag = require('../flag')

function topicCommand (cmd) {
  let idx = cmd.indexOf(':')
  if (idx === -1) return [cmd]
  return [cmd.slice(0, idx), cmd.slice(idx + 1)]
}

function all () {
  let {topics} = require('../..')
  let max = require('lodash.maxby')

  cli.log(`Usage: heroku COMMAND [--app APP] [command-specific-options]

CLI topics: (run ${cli.color.cmd('heroku help TOPIC')} for details)
`)
  topics = topics.filter(t => !t.hidden)
  let maxLength = max(topics, 'name.length').name.length
  for (let topic of topics) {
    cli.log(`  heroku ${S(topic.name).padRight(maxLength)}${topic.description ? ' # ' + topic.description : ''}`)
  }
  cli.log()
}

function topic (cmd) {
  let {commands} = require('../..')
  let max = require('lodash.maxby')

  let [topic, command] = topicCommand(cmd)
  command = commands.find(c => c.topic === topic && (c.command === command || (!c.command && !command)))

  if (command) {
    flag.addHerokuFlags(command)
    let cmd = command.command ? `${command.topic}:${command.command}` : command.topic
    // TODO: get usage if defined
    let usage = `heroku ${cmd}` + (command.args || []).map(renderArg).join('')
    cli.log(`Usage: ${cli.color.cmd(usage)}\n`)
    if (command.description) cli.log(`${command.description.trim()}\n`)
    if (command.flags) cli.log(`${renderFlags(command.flags)}\n`)
    if (command.help) cli.log(`${command.help.trim()}\n`)
  }

  if (cmd.includes(':')) return

  commands = commands.filter(c => c.topic === cmd && c.command)
  if (commands.length === 0) return
  cli.log(`${cmd} commands: (${cli.color.cmd('heroku help ' + cmd + ':COMMAND')} for details)
`)
  let maxLength = max(commands, 'command.length').command.length + cmd.length + 1
  for (let command of commands) {
    let cmd = command.command ? `${command.topic}:${command.command}` : command.topic
    cli.log(`  ${S(cmd).padRight(maxLength)}${command.description ? ' # ' + command.description : ''}`)
  }
  cli.log()
}

function renderArg (arg) {
  if (arg.required !== false && arg.optional !== true) return ` <${arg.name}>`
  else return ` [${arg.name}]`
}

function stderrwidth () {
  if (!process.stdout.isTTY) return 80
  return process.stdout.getWindowSize()[0]
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
      desc = cli.linewrap(maxLength + 4, stderrwidth(), {
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

function run (context) {
  if (context && context.args.topic) topic(context.args.topic)
  else all()
}

module.exports = {
  topic: 'help',
  args: [{name: 'topic', required: false}],
  run
}
