'use strict';
exports.topic = {
  name: 'heroku',
  // this is the help text that shows up under `heroku help`
  description: 'a topic for the sni plugin',
};

exports.commands = [
  require('./commands/sni/index.js'),
  require('./commands/sni/add.js'),
  require('./commands/sni/chain.js'),
  require('./commands/sni/generate.js'),
  require('./commands/sni/info.js'),
  require('./commands/sni/key.js'),
  require('./commands/sni/remove.js'),
  require('./commands/sni/update.js'),
];
