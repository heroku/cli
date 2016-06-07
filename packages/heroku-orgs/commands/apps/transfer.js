'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');
let extend      = require('util')._extend;
let lock        = require('./lock.js').apps;
let Utils       = require('../../lib/utils');

function* run (context, heroku) {
  let app    = context.app;
  let recipient = context.args.recipient;
  let request;
  let transferMsg;

  let appInfo = yield heroku.get(`/apps/${app}`);

  if (Utils.isOrgApp(recipient) || Utils.isOrgApp(appInfo.owner.email)) {
    request = heroku.request({
      method:  'PATCH',
      path:    `/organizations/apps/${app}`,
      body:    {owner: recipient},
    });
    transferMsg = `Transferring ${cli.color.app(app)} to ${cli.color.magenta(recipient)}`;
  } else {
    transferMsg = `Initiating transfer of ${cli.color.app(app)} to ${cli.color.magenta(recipient)}`;
    request = heroku.post(`/account/app-transfers`, {
      body: {
        app: app,
        recipient: recipient
      }
    }).then(request => {
      if (request.state === 'pending') cli.action.done('email sent');
    });
  }

  yield cli.action(transferMsg, request);

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
