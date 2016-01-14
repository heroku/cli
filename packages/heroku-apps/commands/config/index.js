'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');
let _           = require('lodash');
let shellescape = require('shell-escape');

function* run (context, heroku) {
  let configVars = yield heroku.request({path: `/apps/${context.app}/config-vars`});
  if (context.flags.shell) {
    _.forEach(configVars, function (v, k) {
      cli.log(`${k}=${shellescape([v])}`);
    });
  } else if (context.flags.json) {
    cli.log(JSON.stringify(configVars, null, 2));
  } else {
    cli.styledHeader(`${context.app} Config Vars`);
    cli.styledObject(configVars);
  }
}

module.exports = {
  topic: 'config',
  description: 'display the config vars for an app',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'shell', char: 's', description: 'output config vars in shell format'},
    {name: 'json', description: 'output config vars in json format'},
  ],
  run: cli.command(co.wrap(run))
};
