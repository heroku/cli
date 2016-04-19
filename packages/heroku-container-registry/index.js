var pkg = require('./package.json');

module.exports = {
  commands: [
    require('./commands/index')(pkg),
    require('./commands/init')(pkg.topic),
    require('./commands/release')(pkg.topic),
    require('./commands/login')(pkg.topic),
    require('./commands/push')(pkg.topic)
  ]
};
