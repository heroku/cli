'use strict';
let h = require('heroku-cli-util');

module.exports = {
  topic: 'maintenance',
  command: 'off',
  needsApp: true,
  needsAuth: true,
  run: h.command(function* (context, heroku) {
    let app = context.app;
    let p = heroku.apps(app).update({maintenance: false});
    yield h.action(`Disabling maintenance mode for ${h.color.cyan(app)}`, p);
  })
};
