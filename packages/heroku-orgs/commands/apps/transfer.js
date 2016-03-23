'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');
let extend      = require('util')._extend;
let lock        = require('./lock.js').apps;

function* run (context, heroku) {
  let app    = context.app;
  let recipient = context.args.recipient;

  let request = heroku.request({
    method:  'PATCH',
    path:    `/organizations/apps/${app}`,
    body:    {owner: recipient},
  });

  yield cli.action(`Transferring ${cli.color.cyan(app)} to ${cli.color.magenta(recipient)}`, request);

  if (context.flags.locked) {
    yield lock.run(context);
  }
}

let cmd = {
  topic:        'apps',
  command:      'transfer',
  description:  'transfer an app to another user or organization',
  needsAuth:    true,
  needsApp:     true,
  run:          cli.command(co.wrap(run)),
  args:         [{name: 'recipient', description: 'user or org to transfer app to'}],
  flags: [
    {name: 'locked', char: 'l', hasValue: false, required: false, description: 'lock the app upon transfer'},
  ],
  help: `
Examples:

  $ heroku apps:transfer collaborator@example.com
  Transferring example to collaborator@example.com... done

  $ heroku apps:transfer acme-widgets
  Transferring example to acme-widgets... done
  `,
};

module.exports = cmd;
module.exports.sharing = extend({}, cmd);
module.exports.sharing.hidden = true;
module.exports.sharing.topic = 'sharing';
module.exports.sharing.run = function () {
  cli.error(`This command is now ${cli.color.cyan('heroku apps:transfer')}`);
  process.exit(1);
};
