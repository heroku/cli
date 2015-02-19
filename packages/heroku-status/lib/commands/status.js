var api = require('request').defaults({
  json: true,
  headers: { 'Accept': 'application/vnd.heroku+json;' }
});

var colors = require('colors');
var timeago = require('timeago');
var dateFormat = require('dateformat');

function capitalize(str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function printStatus(status) {
  var message = capitalize(status);
  var color = colors[status];

  if (status === 'green') {
    message =  'No known issues at this time.';
  }
  return (color(message));
}

module.exports = {
  topic: '_status',
  description: 'Display current status of Heroku Platform',
  help: 'Example: heroku _status',
  needsAuth: false,
  run: function (context) {

    api = api.defaults({auth: context.auth});
    api.get({
      uri: 'https://status.heroku.com/api/v3/current-status/',
      json: true
    }, function (err, _, response) {
      if (err) { throw err; }
      console.log('=== Heroku Status');
      console.log(`Development: ${printStatus(response.status.Development)}`);
      console.log(`Production: ${printStatus(response.status.Production)}`);

      response.issues.forEach(function(incident) {
        console.log(`\n=== ${incident.title} ${dateFormat(incident.created_at, "UTC:h:MM:ss TT Z")} (${incident.full_url})`);

        incident.updates.forEach(function(update) {
          console.log(`[${capitalize(update.update_type)}] ${dateFormat(incident.created_at, "UTC:h:MM:ss TT Z")} (${timeago(update.updated_at)}) \n${update.contents}\n `)
        });
      });
    });
  }
}
