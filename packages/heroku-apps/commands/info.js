'use strict';
let sprintf = require('sprintf-js');
let co = require('co');
let Heroku = require('heroku-client');
let filesize = require('filesize');
let _ = require('lodash');

function line(name, value) {
  if (name) {
    name = name + ':';
  }
  return sprintf.sprintf('%-15s%s', name, value);
}

module.exports = {
  topic: '_apps',
  command: 'info',
  needsApp: true,
  needsAuth: true,
  run: function (context) {
    co(function *() {
      let heroku = new Heroku({token: context.auth.password});
      console.log(`=== ${context.app}`);
      let info = yield {
        addons: heroku.apps(context.app).addons().list(),
        app: heroku.apps(context.app).info(),
        dynos: heroku.apps(context.app).dynos().list()
      };
      let header = 'Addons';
      for (let addon of info.addons) {
        console.log(line(header, addon.plan.name));
        header = '';
      }
      console.log(line('Git URL', info.app.git_url));
      console.log(line('Owner', info.app.owner.email));
      console.log(line('Region', info.app.region.name));
      console.log(line('Repo Size', filesize(info.app.repo_size, {round: 0})));
      console.log(line('Slug Size', filesize(info.app.slug_size, {round: 0})));
      console.log(line('Stack', info.app.stack.name));
      console.log(line('Web URL', info.app.web_url));
      console.log(line('Dynos', ''));
      _.forOwn(_.countBy(info.dynos, 'type'), function (count, type) {
        console.log(line(`  ${type}`, count));
      });
      console.log(line('  total', info.dynos.length));
    }).catch(function (err) {
      console.error(err.stack);
    });
  }
};
