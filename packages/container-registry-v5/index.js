var pkg = require('./package.json')

module.exports = {
  topic: {
    topic: 'container',
    description: 'Use containers to build and deploy Heroku apps',
    name: 'container',
    help: pkg.description,
  },
  commands: [
    require('./commands/rm')(pkg.topic),
    require('./commands/index')(pkg),
    require('./commands/login')(pkg.topic),
    require('./commands/logout')(pkg.topic),
    require('./commands/pull')(pkg.topic),
    require('./commands/push')(pkg.topic),
    require('./commands/release')(pkg.topic),
    require('./commands/run')(pkg.topic),
  ],
}
