'use strict';
let co = require('co');
let columnify = require('columnify');
let Heroku = require('heroku-client');
let api = require('./shared.js');

module.exports = {
  topic: 'redis',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  shortHelp: 'gets information about redis',
  run: function(context) {
    co(function *() {
      let heroku = new Heroku({
        token: context.auth.password,
        headers: {
          'Accept': 'application/vnd.heroku+json; version=3.switzerland'
        }
      });
      let addons = yield heroku.apps(context.app).addons().list();
      // filter out non-redis addons
      addons = api.make_addons_filter(context.args.database)(addons);
      // get info for each db
      let databases = yield addons.map(function (addon) {
        return {
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
            continue
          }
          console.log(`=== ${db.addon.config_vars[0]}`);
          console.log(columnify(db.redis.info, { showHeaders: false }));
      }
    }).catch(function (err) {
      console.error(err.stack);
      process.exit(1);
    });
  }
};
