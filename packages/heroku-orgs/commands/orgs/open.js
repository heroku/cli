'use strict';

let cli = require('heroku-cli-util');
let co  = require('co');

function* run (context, heroku) {
  let org = yield heroku.get(`/organizations/${context.org}`);
  yield cli.open(`https://dashboard.heroku.com/orgs/${org.name}`);
}

module.exports = {
  topic:        'orgs',
  command:      'open',
  description:  'open the organization interface in a browser window',
  needsAuth:    true,
  needsOrg:     true,
  run:          cli.command(co.wrap(run))
};
