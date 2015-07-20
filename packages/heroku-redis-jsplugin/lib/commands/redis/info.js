'use strict';
let columnify = require('columnify');
let api = require('./shared.js');
let h = require('heroku-cli-util');

module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  description: 'gets information about redis',
  run: h.command(function *(context, heroku) {
    let addons = yield heroku.apps(context.app).addons().list();
    // filter out non-redis addons
    addons = api.make_addons_filter(context.args.database)(addons);
    // get info for each db
    let databases = yield addons.map(function* (addon) {
      return yield {
        addon: addon,
        redis: api.request(context, addon.name).catch(function (err) {
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

      db.redis.info.push({name: 'Resource', values: [db.addon.name]})

      console.log(`=== ${db.addon.config_vars[0]}`);
      console.log(columnify(db.redis.info, {showHeaders: false}));
      console.log();
    }
  })
};
