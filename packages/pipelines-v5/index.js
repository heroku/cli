var flatten = require('lodash.flatten')

exports.topic = [
  { name: 'pipelines', description: 'manage collections of apps in pipelines' },
  { name: 'reviewapps', description: 'manage reviewapps in pipelines' }
]

exports.commands = flatten([
  require('./commands/pipelines/add.js'),
  require('./commands/pipelines/connect.js'),
  require('./commands/pipelines/create.js'),
  require('./commands/pipelines/destroy.js'),
  require('./commands/pipelines/diff.js'),
  require('./commands/pipelines/index.js'),
  require('./commands/pipelines/info.js'),
  require('./commands/pipelines/open.js'),
  require('./commands/pipelines/promote.js'),
  require('./commands/pipelines/remove.js'),
  require('./commands/pipelines/rename.js'),
  require('./commands/pipelines/setup.js'),
  require('./commands/pipelines/transfer.js'),
  require('./commands/review_apps/disable.js'),
  require('./commands/review_apps/enable.js')
])

exports.disambiguatePipeline = require('./lib/disambiguate')
