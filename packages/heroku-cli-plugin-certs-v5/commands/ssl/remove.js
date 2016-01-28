'use strict';

let co      = require('co');
let cli     = require('heroku-cli-util');

// todo: check that the cname is unique

function* run(context, heroku) {

  var name = context.args.name;

  yield cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will remove the endpoint ${name} from ${context.app}.`);

  cli.log(`Removing SSL Endpoint ${name} from ${context.app}...`);
  
  yield heroku.request({
    path: `/apps/${context.app}/sni-endpoints/${name}`,
    method: 'DELETE',
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  });

  cli.log('NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.');
}

module.exports = {
  topic: '_ssl',
  command: 'remove',
  args: [
    { name: 'name', optional: false }
  ],
  flags: [{
    name: 'confirm', 
    hasValue: true,
    optional: true, 
    hidden: true
  }],
  description: 'Remove an SSL Endpoint from an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run)),
};
