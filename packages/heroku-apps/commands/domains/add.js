'use strict';

let cli         = require('heroku-cli-util');
let co          = require('co');

function* run (context, heroku) {
  let hostname = context.args.hostname;
  let domain = yield cli.action(`Adding ${cli.color.green(hostname)} to ${cli.color.cyan(context.app)}`, heroku.request({
    path: `/apps/${context.app}/domains`,
    method: 'POST',
    body: {hostname},
  }));
  cli.warn(`Configure your app's DNS provider to point to the DNS Target ${cli.color.green(domain.cname)}.\nFor help, see https://devcenter.heroku.com/articles/custom-domains`);
}

module.exports = {
  topic: 'domains',
  command: 'add',
  description: 'add domain to an app',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'hostname'}],
  run: cli.command(co.wrap(run))
};
