'use strict';
let cli = require('heroku-cli-util');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'promote',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: false}],
  description: 'sets DATABASE as your REDIS_URL',
  run: cli.command(function* (context, heroku) {
    let addonsFilter = api.make_addons_filter(context.args.database);
    let redisFilter = api.make_addons_filter('REDIS_URL');
    let addonsList = heroku.apps(context.app).addons().listByApp();
    let redis = redisFilter(yield addonsList);
    let addons = addonsFilter(yield addonsList);
    if (addons.length === 0) {
      cli.error('No Redis instance found.');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      cli.error(`Please specify a single instance. Found: ${names.join(', ')}`);
      process.exit(1);
    }
    // Check if REDIS_URL is singlehandly assigned
    if (redis.length === 1 && redis[0].config_vars.length === 1) {
      let attachment = redis[0];
      yield heroku.post('/addon-attachments', {
        app: { name: context.app },
        addon: { name: attachment.name },
        confirm: context.app
      });
    }
    let addon = addons[0];
    console.log(`Promoting ${addon.name} to REDIS_URL on ${context.app}`);
    yield heroku.post('/addon-attachments', {
      app: { name: context.app },
      addon: { name: addon.name },
      confirm: context.app,
      name: 'REDIS'
    });
  })
};
