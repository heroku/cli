'use strict';
let cli = require('heroku-cli-util');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'maintenance',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'window', char: 'w', description: 'set weekly UTC maintenance window', hasValue: true, optional: true},
    {name: 'run', description: 'start maintenance', optional: true},
    {name: 'force', char: 'f', description: 'start maintenance without entering application maintenance mode', optional: true}
  ],
  description: 'manage maintenance windows',
  help: `Set or change the maintenance window for your Redis instance`,
  run: cli.command(function* (context, heroku) {
    let addonsFilter = api.make_addons_filter(context.args.database);
    let addons = addonsFilter(yield heroku.apps(context.app).addons().listByApp());
    if (addons.length === 0) {
      cli.error('No redis databases found');
      process.exit(1);
    } else if (addons.length > 1) {
      let names = addons.map(function (addon) { return addon.name; });
      cli.error(`Please specify a single instance. Found: ${names.join(', ')}`);
      process.exit(1);
    }
    let addon = addons[0];
    
    if (addon.plan.name.match(/hobby/) != null) {
      cli.error('redis:maintenance is not available for hobby-dev instances');
      process.exit(1);
    }

    if (context.flags.window) {
      if (context.flags.window.match(/[A-Za-z]{3,10} \d\d?:[03]0/) == null) {
        cli.error('Maintenance windows must be "Day HH:MM", where MM is 00 or 30.');
        process.exit(1);
      }

      let maintenance = yield api.request(context, `/client/v11/databases/${addon.name}/maintenance_window`, 'PUT', { description: context.flags.window });
      console.log(`Maintenance window for ${addon.name} (${addon.config_vars.join(', ')}) set to ${maintenance.window}.`);
      process.exit(0);
    }

    if (context.flags.run) {
      let app = yield heroku.apps(context.app).info();
      if (!app.maintenance && !context.flags.force) {
        cli.error('Application must be in maintenance mode or --force flag must be used');
        process.exit(1);
      }

      let maintenance = yield api.request(context, `/client/v11/databases/${addon.name}/maintenance`, 'POST');
      console.log(maintenance.message);
      process.exit(0);
    }

    let maintenance = yield api.request(context, `/client/v11/databases/${addon.name}/maintenance`, 'GET', null);
    console.log(maintenance.message);
  })
};
