'use strict';
let h   = require('heroku-cli-util');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'credentials',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'reset'}],
  description: 'display credentials information',
  run: h.command(function* (context, heroku) {
    if (context.flags.reset) {
      let addonsFilter = api.make_addons_filter(context.args.database);
      let addons = addonsFilter(yield heroku.apps(context.app).addons().list());
      if (addons.length === 0) {
        h.error('No redis databases found');
        process.exit(1);
      } else if (addons.length > 1) {
        let names = addons.map(function (addon) { return addon.name; });
        h.error(`Please specify a single database. Found: ${names.join(', ')}`);
        process.exit(1);
      }
      let addon = addons[0];
      console.log(`Resetting credentials for ${addon.name}`);
      yield api.request(context, `${addon.name}/credentials_rotation`, 'POST');
    } else {
      let varFilter = api.make_config_var_filter(context.args.database);
      let addons = varFilter(yield heroku.apps(context.app).configVars().info());
      if (addons.length === 0) {
        h.error('No redis databases found');
        process.exit(1);
      } else {
        console.log(addons[0].url);
      }
    }
  })
};
