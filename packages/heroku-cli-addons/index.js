'use strict'

const flatten = require('lodash.flatten')

exports.topic = {
  name: 'addons',
  description: 'manage add-ons'
}

exports.commands = flatten([
  require('./commands/addons'),
  require('./commands/addons/attach'),
  require('./commands/addons/create'),
  require('./commands/addons/destroy'),
  require('./commands/addons/detach'),
  require('./commands/addons/docs'),
  require('./commands/addons/info'),
  require('./commands/addons/open'),
  require('./commands/addons/plans'),
  require('./commands/addons/rename'),
  require('./commands/addons/services'),
  require('./commands/addons/upgrade'),
  require('./commands/addons/wait')
])

exports.resolve = require('./lib/resolve')
exports.createAddon = require('./lib/create_addon')
