'use strict';

let cli    = require('heroku-cli-util');
let co     = require('co');
let _      = require('lodash');
let extend = require('util')._extend;

function* run (context, heroku) {
  if (context.args.length === 0) {
    cli.error('Usage: heroku config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.');
    process.exit(1);
  }
  let p = heroku.request({
    method: 'patch',
    path: `/apps/${context.app}/config-vars`,
    // body will be like {FOO: null, BAR: null}
    body: _.reduce(context.args, (vars, v) => {vars[v] = null; return vars;}, {})
  });
  let vars = context.args.map(v => cli.color.green(v)).join(', ');
  yield cli.action(`Unsetting ${vars} and restarting ${cli.color.app(context.app)}`, p);
}

let cmd = {
  topic: 'config',
  command: 'unset',
  description: 'unset one or more config vars',
  help: `
 Examples:

 $ heroku config:unset RAILS_ENV
 Unsetting RAILS_ENV and restarting example... done

 $ heroku config:unset RAILS_ENV RACK_ENV
 Unsetting RAILS_ENV, RACK_ENV and restarting example... done`,
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(run))
};

module.exports.unset = cmd;
module.exports.remove = extend({}, cmd);
module.exports.remove.command = 'remove';
