'use strict';
let h   = require('heroku-cli-util');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'promote',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: false}],
  shortHelp: 'sets DATABASE as your REDIS_URL',
  run: h.command(function* (context, heroku) {
    let addonsFilter = api.make_addons_filter(context.args.database);
    let addons = addonsFilter(yield heroku.apps(context.app).addons().list());
    if (addons.length === 0) {
      h.error('No redis database found');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      h.error('Please specify a single database. Found: ' + names.join(', '));
      process.exit(1);
    }
    let name = addons[0].name;
    console.log('Promoting ' + name + ' to REDIS_URL on '+ context.app);
    yield heroku.post('/addon-attachments', {
      app: { name: context.app },
      addon: { name: name },
      confirm: context.app,
      name: 'REDIS'
    });
  })
};
