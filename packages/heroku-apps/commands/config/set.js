'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let extend = require('util')._extend;
let _      = require('lodash');

function* run (context, heroku) {
  let vars = _.reduce(context.args, function (vars, v) {
    if (v.indexOf('=') === -1) {
      cli.error(`${cli.color.cyan(v)} is invalid. Must be in the format ${cli.color.cyan('FOO=bar')}.`);
      process.exit(1);
    }
    v = v.split('=');
    vars[v[0]] = v[1];
    return vars;
  }, {});
  let p = heroku.request({
    method: 'patch',
    path: `/apps/${context.app}/config-vars`,
    body: vars,
  });
  yield cli.action(`Setting config vars and restarting ${context.app}`, p);
}

let cmd = {
  topic: 'config',
  command: 'set',
  description: 'set one or more config vars',
  help: `Examples:

 $ heroku config:set RAILS_ENV=staging
 Setting config vars and restarting example... done
 RAILS_ENV: staging

 $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
 Setting config vars and restarting example... done
 RAILS_ENV: staging
 RACK_ENV:  staging
 `,
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(run))
};

module.exports.set = cmd;
module.exports.add = extend({}, cmd);
module.exports.add.command = 'add';
