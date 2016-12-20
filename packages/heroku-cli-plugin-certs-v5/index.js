'use strict'

let _ = require('lodash')

exports.topic = {
  name: 'certs',
  // this is the help text that shows up under `heroku help`
  description: 'a topic for the ssl plugin'
}

let commands = [
  require('./commands/certs/index.js'),
  require('./commands/certs/add.js'),
  require('./commands/certs/chain.js'),
  require('./commands/certs/generate.js'),
  require('./commands/certs/info.js'),
  require('./commands/certs/key.js'),
  require('./commands/certs/remove.js'),
  require('./commands/certs/rollback.js'),
  require('./commands/certs/update.js')
]

function deprecate (cmd) {
  let deprecatedRun = function (context) {
    let cli = require('heroku-cli-util')
    let topicAndCommand = _.select([cmd.topic, cmd.command]).join(':')
    cli.warn(`${cli.color.cmd(`heroku _${topicAndCommand}`)} has been deprecated. Please use ${cli.color.cmd(`heroku ${topicAndCommand}`)} instead.`)
    return cmd.run(context)
  }

  return Object.assign({}, cmd, {topic: '_certs', hidden: true, run: deprecatedRun})
}

exports.commands = commands.concat(commands.map((cmd) => deprecate(cmd)))
