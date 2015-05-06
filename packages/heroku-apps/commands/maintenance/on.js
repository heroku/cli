'use strict';
let h = require('heroku-cli-util');
let chalk = require('chalk');

module.exports = {
  topic: 'maintenance',
  command: 'on',
  needsApp: true,
  needsAuth: true,
  run: h.command(function* (context, heroku) {
    let app = context.app;
    process.stdout.write(`Enabling maintenance mode for ${chalk.blue(app)}... `);
    yield heroku.apps(app).update({maintenance: true});
    console.log('done');
  })
};
