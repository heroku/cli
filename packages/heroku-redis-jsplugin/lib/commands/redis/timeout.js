'use strict';
let cli = require('heroku-cli-util');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'timeout',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'seconds', char: 's', description: 'set timeout value', hasValue: true}],
  description: 'set the number of seconds to wait before killing idle connections',
  help: 'Sets the number of seconds to wait before killing idle connections. A value of zero means that connections will not be closed.',
  run: cli.command(function* (context, heroku) {
    if (!context.flags.seconds) {
      cli.error('Please specify a valid timeout value.');
      process.exit(1);
    }
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
    let config = yield api.request(context, `/redis/v0/databases/${addon.name}/config`, 'PATCH', { timeout: parseInt(context.flags.seconds, 10) });
    console.log(`Timeout for ${addon.name} (${addon.config_vars.join(', ')}) set to ${config.timeout.value} seconds.`);
    if (config.timeout.value === 0) {
      console.log('Connections to the Redis instance can idle indefinitely.');
    } else {
      console.log(`Connections to the Redis instance will be stopped after idling for ${config.timeout.value} seconds.`);
    }
  })
};
