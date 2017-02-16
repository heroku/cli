const {CommandList} = require('heroku-cli-command')

exports.commands = new CommandList(
  require('./update'),
  require('./version'),
  require('./plugins/install')
)
