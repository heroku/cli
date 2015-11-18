'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let extend = require('util')._extend;
let _      = require('lodash');

function* run (context, heroku) {
  let vars = _.reduce(context.args, function (vars, v) {
    let idx = v.indexOf('=');
    if (idx === -1) {
      cli.error(`${cli.color.cyan(v)} is invalid. Must be in the format ${cli.color.cyan('FOO=bar')}.`);
      process.exit(1);
    }
    vars[v.slice(0, idx)] = v.slice(idx+1);
    return vars;
  }, {});
  let p = heroku.request({
    method: 'patch',
    path: `/apps/${context.app}/config-vars`,
    body: vars,
  });
  let configVars = yield cli.action(`Setting config vars and restarting ${cli.color.app(context.app)}`, p);
  configVars = _.pick(configVars, (_, k) => vars[k]);
  cli.styledObject(configVars);
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
