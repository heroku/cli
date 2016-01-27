'use strict';

let cli    = require('heroku-cli-util');
let http   = require('../lib/http');
let moment = require('moment');
let co     = require('co');

function capitalize(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function printStatus(status) {
  var message = capitalize(status);
  var colorize = cli.color[status];

  if (status === 'green') {
    message = 'No known issues at this time.';
  }
  return colorize(message);
}

function* run () {
  let response = yield http.getJson({
    hostname: process.env.HEROKU_STATUS_HOST || 'status.heroku.com',
    path: '/api/v3/current-status',
    method: 'GET',
    headers: { 'Accept': 'application/vnd.heroku+json;' },
  });

  cli.log(`Production:   ${printStatus(response.status.Production)}`);
  cli.log(`Development:  ${printStatus(response.status.Development)}`);

  response.issues.forEach(function(incident) {
    cli.log();
    cli.styledHeader(`${incident.title} ${moment(incident.created_at).format('LT')} (${incident.full_url})`);

    incident.updates.forEach(function(update) {
      cli.log(`[${capitalize(update.update_type)}] ${moment(update.updated_at).format('LT')} (${moment(update.updated_at).fromNow()})`);
      cli.log(update.contents);
    });
  });
}

module.exports = {
  topic: 'status',
  description: 'display current status of Heroku platform',
  run: cli.command(co.wrap(run))
};
