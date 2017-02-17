const klaw = require('klaw-sync')
const {Topic} = require('heroku-cli-command')

class Plugins extends Topic {}
Plugins.topic = 'plugins'
Plugins.description = 'manage heroku plugins'
exports.topics = [Plugins]

exports.commands = klaw(__dirname, {nodir: true}).map(f => require(f.path))
