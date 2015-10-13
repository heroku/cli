'use strict';
let h = require('heroku-cli-util');

module.exports = {
  topic: 'maintenance',
  command: 'on',
  description: 'put the app into maintenance mode',
  needsApp: true,
  needsAuth: true,
  run: h.command(function* (context, heroku) {
    let app = context.app;
    let p = heroku.apps(app).update({maintenance: true});
    yield h.action(`Enabling maintenance mode for ${h.color.cyan(app)}`, p);
  })
};
