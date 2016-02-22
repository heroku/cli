'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  default: true,
  args: [{name: 'database', optional: true}],
  description: 'gets information about redis',
  run: cli.command(function *(context, heroku) {
    let addons = yield heroku.apps(context.app).addons().listByApp();
    // filter out non-redis addons
    addons = api.make_addons_filter(context.args.database)(addons);
    // get info for each db
    let databases = yield addons.map(function* (addon) {
      return yield {
        addon: addon,
        redis: api.request(context, `/redis/v0/databases/${addon.name}`).catch(function (err) {
          if (err.statusCode !== 404) {
            throw(err);
          }
          return null;
        })
      };
    });

    // print out the info of the addon and redis db info
    for (let db of databases) {
      if (db.redis === null) {
        continue;
      }

      cli.styledHeader(`${db.addon.name} (${db.addon.config_vars.join(', ')})`);
      cli.styledHash(db.redis.info.reduce(function(memo, row) {
        memo[row.name] = row.values;
        return memo;
      }, {}), db.redis.info.map(function(row) { return row.name; }));
    }
  })
};
