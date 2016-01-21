'use strict';

let co  = require('co');
let cli = require('heroku-cli-util');
let url = require('url');

function insecureURL (uri) {
  if (uri.protocol === "https:") return false;
  // allow localhost, 10.* and 192.* clients for testing
  if (uri.host === "localhost") return false;
  if (/\.local$/.test(uri.host)) return false;
  if (uri.host.match(/^(10\.|192\.)/)) return false;
  return true;
}

function validateURL (uri) {
  let u = url.parse(uri);
  if (!u.protocol) throw new Error('Invalid URL');
  if (insecureURL(u)) throw new Error("Unsupported callback URL. Clients have to use HTTPS.");
  return uri;
}

function* run (context, heroku) {
  let request = heroku.request({
    method:  'POST',
    path:    '/oauth/clients',
    body: {
      name: context.args.name,
      redirect_uri: context.args['redirect_uri'],
    }
  });
  let client = yield cli.action(`Creating ${context.args.name}`, request);
  cli.log(`Get details with ${cli.color.cyan('heroku clients:info ' + client.id)}`);
}

module.exports = {
  topic:       'clients',
  command:     'create',
  description: 'create a new OAuth client',
  needsAuth:   true,
  args:        [{name: 'name'}, {name: 'redirect_uri'}],
  run: cli.command(co.wrap(run))
};
