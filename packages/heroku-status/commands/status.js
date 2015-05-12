'use strict';

var api = require('request').defaults({
  json: true,
  headers: { 'Accept': 'application/vnd.heroku+json;' }
});

let h          = require('heroku-cli-util');
var timeago    = require('timeago');
var dateFormat = require('dateformat');

function capitalize(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function printStatus(status) {
  var message = capitalize(status);
  var colorize = h.color[status];

  if (status === 'green') {
    message =  'No known issues at this time.';
  }
  return (colorize(` ${message} `));
}

module.exports = {
  topic: 'status',
  description: 'Display current status of Heroku Platform',
  help: 'Example: heroku status',
  run: h.command(function () {
    let host = process.env.HEROKU_STATUS_HOST || 'status.heroku.com';
    api.get(`https://${host}/api/v3/current-status/`,
            function (err, _, response) {
              if (err) { throw err; }
              console.log('=== Heroku Status');
              console.log(`Production:  ${printStatus(response.status.Production)}`);
              console.log(`Development: ${printStatus(response.status.Development)}`);

              response.issues.forEach(function(incident) {
                console.log(`\n=== ${incident.title} ${dateFormat(incident.created_at, "UTC:h:MM:ss TT Z")} (${incident.full_url})`);

                incident.updates.forEach(function(update) {
                  console.log(`[${capitalize(update.update_type)}] ${dateFormat(incident.created_at, "UTC:h:MM:ss TT Z")} (${timeago(update.updated_at)}) \n${update.contents}\n `);
                });
              });
            });
  })
};
