'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let request = heroku.request({
    method:     'POST',
    path:       `/v1/app/${context.app}/join`,
    headers:    {Accept: 'application/json'}
  });
  yield cli.action(`Joining ${cli.color.cyan(context.app)}`, request);
}

let cmd = {
  topic:        'apps',
  command:      'join',
  description:  'add yourself to an organization app',
  needsAuth:    true,
  needsApp:     true,
  run:          cli.command(co.wrap(run))
};

module.exports.apps = cmd;
module.exports.root = Object.assign({}, cmd, {topic: 'join', command: null});
