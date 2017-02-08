const {CommandList} = require('heroku-command')

exports.commands = new CommandList(
  require('./update'),
  require('./version')
)
