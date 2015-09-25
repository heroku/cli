'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function printJSON (data) {
  cli.log(JSON.stringify(data.dynos, null, 2));
}

function print (data) {
  cli.log(data.quota);
}

function* run (context, heroku) {
  let data = yield {
    quota: heroku.request({path: `/apps/${context.app}/actions/get-quota`, method: 'post', headers: {accept: 'application/vnd.heroku+json; version=3.app-quotas'}}),
    dynos: heroku.request({path: `/apps/${context.app}/dynos`}),
  };
  if (context.flags.json) {
    printJSON(data);
  } else {
    print(data);
  }
}

module.exports = {
  topic: '_ps',
  description: 'list dynos for an app',
  flags: [
    {name: 'json', description: 'display as json'},
  ],
  help: `
Example:

 $ heroku ps
 === run: one-off dyno
 run.1: up for 5m: bash

 === web: bundle exec thin start -p $PORT
 web.1: created for 30s`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
};
