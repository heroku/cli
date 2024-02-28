var pkg = require('./package.json')

module.exports = {
  topic: {
    topic: 'container',
    description: 'Use containers to build and deploy Heroku apps',
    name: 'container',
    help: pkg.description,
  },
  commands: [
    require('./commands/push')(pkg.topic),
    require('./commands/release')(pkg.topic),
  ],
}
