'use strict';

exports.topic = {
  name: 'spaces',
  description: 'manage heroku private spaces',
};

exports.commands = [
  require('./commands'),
  require('./commands/create'),
  require('./commands/destroy'),
  require('./commands/info'),
  require('./commands/rename'),
  require('./commands/inboundrules'),
  require('./commands/inboundrules/add'),
  require('./commands/inboundrules/default'),
  require('./commands/inboundrules/remove'),
];
