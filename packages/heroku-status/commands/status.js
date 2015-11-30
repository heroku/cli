'use strict';

let cli        = require('heroku-cli-util');
let http       = require('../lib/http');
let timeago    = require('timeago');
let strftime   = require('strftime');
let co         = require('co');

function capitalize(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function printStatus(status) {
  var message = capitalize(status);
  var colorize = cli.color[status];

  if (status === 'green') {
    message =  'No known issues at this time.';
  }
  return (colorize(` ${message} `));
}

function* run () {
  let response = yield http.getJson({
    hostname: process.env.HEROKU_STATUS_HOST || 'status.heroku.com',
    path: '/api/v3/current-status',
    method: 'GET',
    headers: { 'Accept': 'application/vnd.heroku+json;' },
  });

  cli.styledHeader('Heroku Status');
  console.log(`Production:  ${printStatus(response.status.Production)}`);
  console.log(`Development: ${printStatus(response.status.Development)}`);

  response.issues.forEach(function(incident) {
    console.log(`\n=== ${incident.title} ${strftime('%l:%M %p', incident.created_at)} (${incident.full_url})`);

    incident.updates.forEach(function(update) {
      console.log(`[${capitalize(update.update_type)}] ${strftime('%l:%M %p', incident.created_at)} (${timeago(update.updated_at)}) \n${update.contents}\n `);
    });
  });
}

module.exports = {
  topic: 'status',
  description: 'Display current status of Heroku Platform',
  help: 'Example: heroku status',
  run: cli.command(co.wrap(run))
};
