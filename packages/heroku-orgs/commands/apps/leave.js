'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let app = yield heroku.get(`/apps/${context.app}`).catch(() => null);
  let request;
  if (app && app.owner.email.endsWith('@herokumanager.com')) {
    request = heroku.request({
      method:     'DELETE',
      path:       `/v1/app/${context.app}/join`,
      parseJSON:  false,
      headers:    {Accept: 'application/json'}
    }).catch(function (err) {
      throw new Error(err.body);
    });
  } else {
    request = heroku.get('/account')
    .then(function (user) {
      return heroku.request({
        method:     'DELETE',
        path:       `/apps/${context.app}/collaborators/${encodeURIComponent(user.email)}`,
      });
    });
  }
  yield cli.action(`Leaving ${cli.color.cyan(context.app)}`, request);
}

let cmd = {
  topic:        'apps',
  command:      'leave',
  description:  'remove yourself from an organization app',
  needsAuth:    true,
  needsApp:     true,
  run:          cli.command(co.wrap(run))
};

module.exports.apps = cmd;
module.exports.root = Object.assign({}, cmd, {topic: 'leave', command: null});
