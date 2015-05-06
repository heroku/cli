'use strict';
let h = require('heroku-cli-util');
let chalk = require('chalk');

module.exports = {
  topic: '_maintenance',
  command: 'off',
  needsApp: true,
  needsAuth: true,
  run: h.command(function* (context, heroku) {
    let app = context.app;
    process.stdout.write(`Disabling maintenance mode for ${chalk.blue(app)}... `);
    yield heroku.apps(app).update({maintenance: false});
    console.log('done');
  })
};
