'use strict';
exports.topic = {
  name: 'heroku',
  // this is the help text that shows up under `heroku help`
  description: 'a topic for the ssl plugin',
};

exports.commands = [
  require('./commands/ssl/index.js'),
  require('./commands/ssl/add.js'),
  require('./commands/ssl/chain.js'),
  require('./commands/ssl/generate.js'),
  require('./commands/ssl/info.js'),
  require('./commands/ssl/key.js'),
  require('./commands/ssl/remove.js'),
  require('./commands/ssl/update.js'),
];
