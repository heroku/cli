'use strict';
let cli = require('heroku-cli-util');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'reset'}],
  description: 'display credentials information',
  run: cli.command(function* (context, heroku) {
    let addonsFilter = api.make_addons_filter(context.args.database);
    let addons = addonsFilter(yield heroku.apps(context.app).addons().listByApp());
    if (addons.length === 0) {
      cli.error('No Redis instances found.');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      cli.error(`Please specify a single instance. Found: ${names.join(', ')}`);
      process.exit(1);
    }
    let addon = addons[0];
    if (context.flags.reset) {
      console.log(`Resetting credentials for ${addon.name}`);
      yield api.request(context, `${addon.name}/credentials_rotation`, 'POST');
    } else {
      let redis = yield api.request(context, addon.name);
      if (addons.length === 0) {
        cli.error('No Redis instances found.');
        process.exit(1);
      } else {
        console.log(redis.resource_url);
      }
    }
  })
};
