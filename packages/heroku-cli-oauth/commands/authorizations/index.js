'use strict';

let co  = require('co');
let cli = require('heroku-cli-util');

function* run (context, heroku) {
  let authorizations = yield heroku.get('/oauth/authorizations');

  if (context.flags.json) {
    cli.log(JSON.stringify(authorizations, null, 2));
  } else if (authorizations.length === 0) {
    cli.log('No OAuth authorizations.');
  } else {
    cli.table(authorizations, {
      printHeader: null,
      columns: [
        {key: 'description'},
        {key: 'id'},
        {key: 'scope', format: v => v.join(',')},
      ]
    });
  }
}

module.exports = {
  topic: 'authorizations',
  description: 'list OAuth authorizations',
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
};
