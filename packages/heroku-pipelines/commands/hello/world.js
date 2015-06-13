'use strict';

module.exports = {
  topic: 'hello',
  command: 'world',
  description: 'tells you hello',
  default: true,
  help: 'help text for hello:world',
  flags: [
    {name: 'user', char: 'u', description: 'user to say hello to', hasValue: true}
  ],
  run: function (context) {
    if (context.flags.user) {
      console.log(`Hello, ${context.flags.user}!`);
    } else {
      console.log('Hello, World!');
    }
  }
};
