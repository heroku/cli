var pkg = require('./package.json');

module.exports = {
  commands: [
    require('./commands/index')(pkg),
    require('./commands/login')(pkg.topic),
    require('./commands/logout')(pkg.topic),
    require('./commands/push')(pkg.topic)
  ]
};
