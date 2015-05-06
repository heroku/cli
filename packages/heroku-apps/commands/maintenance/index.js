'use strict';
let h = require('heroku-cli-util');

module.exports = {
  topic: 'maintenance',
  needsApp: true,
  needsAuth: true,
  run: h.command(function* (context, heroku) {
    let app = yield heroku.apps(context.app).info();
    console.log(app.maintenance ? 'on' : 'off');
  })
};
