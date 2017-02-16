const klaw = require('klaw-sync')

exports.topics = [
  {name: 'update', description: 'update CLI and plugins'}
]

exports.commands = klaw(__dirname, {nodir: true}).map(f => require(f.path))
