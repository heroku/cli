'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');

let endpoints     = require('../../lib/endpoints.js').certsAndDomains;
let display_table = require('../../lib/display_table.js');

function* run(context, heroku) {
  let certsAndDomains = yield endpoints(context.app, heroku);

  if (certsAndDomains.certs.length === 0) {
    cli.log(`${context.app} has no SSL certificates.\nUse \`heroku _certs:add CRT KEY\` to add one.`);
  } else {
    display_table(certsAndDomains.certs, certsAndDomains.domains);
  }
}

module.exports = {
  topic: '_certs',
  description: 'List SSL certificates for an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
