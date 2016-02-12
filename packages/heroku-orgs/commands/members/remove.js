'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let org   = context.org;
  let email = context.args.email;

  let request = heroku.request({
    method: 'DELETE',
    path:   `/organizations/${org}/members/${encodeURIComponent(email)}`,
  });
  yield cli.action(`Removing ${cli.color.cyan(email)} from ${cli.color.magenta(org)}`, request);
}

module.exports = {
  topic:        'members',
  command:      'remove',
  description:  'removes a user from an organization',
  needsAuth:    true,
  needsOrg:     true,
  args:         [{name: 'email'}],
  run:          cli.command(co.wrap(run))
};
