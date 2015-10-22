'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'redis',
  command: 'wait',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  description: 'wait for Redis instance to be available',
  run: cli.command(function *(context, heroku) {
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
    let interval = setInterval(function () {
      api.request(context, addon.name + '/wait', 'GET').then(function(status) {
        if (!status['waiting?']) {
          clearInterval(interval);
        }
      }, function(error) {
        cli.error(error);
        clearInterval(interval);
      });
    }, 500);
  })
};
