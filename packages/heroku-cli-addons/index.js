'use strict'

exports.topic = {
  name: 'addons',
  description: 'manage add-ons'
}

exports.commands = [
  require('./commands/addons'),
  require('./commands/addons/attach'),
  require('./commands/addons/detach'),
  require('./commands/addons/docs'),
  require('./commands/addons/info'),
  require('./commands/addons/open'),
  require('./commands/addons/plans'),
  require('./commands/addons/rename'),
  require('./commands/addons/services'),
  require('./commands/addons/upgrade').upgrade,
  require('./commands/addons/upgrade').downgrade
]
