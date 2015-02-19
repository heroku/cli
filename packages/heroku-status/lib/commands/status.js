// TODO: Fix this in status.

// 1. The response should be lower case (Development -> development)
// 2. I should add an endpoint that returns the possible status colors (red, yellow, green...) (?)

var api = require('request').defaults({
  json: true,
  headers: { 'Accept': 'application/vnd.heroku+json;' }
});

var colors = require('colors');
var timeago = require('timeago');
var dateFormat = require('dateformat');

function printStatus(status) {
  var message;
  var color = colors.green;
  switch(status) {
    case 'green':
      message =  'No known issues at this time.';
      break;
    case 'red':
      color = colors.red;
      message = 'Red';
      break;
    case 'yellow': // ?
      color = color.yellow;
      message = 'Yellow';
      break;
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
      console.log('Development: %s', printStatus(response.status.Development));
      console.log('Production: %s', printStatus(response.status.Production));

      response.issues.forEach(function(incident) {
        console.log('\n=== %s %s', incident.title, dateFormat(incident.created_at, "UTC:h:MM:ss TT Z"));

        incident.updates.forEach(function(update) {
          var updateType = update.update_type.substr(0, 1).toUpperCase() + update.update_type.substr(1); // Capitalize first letter
          console.log('%s (%s) [%s] %s\n', dateFormat(incident.created_at, "UTC:h:MM:ss TT Z"), timeago(update.updated_at), updateType, update.contents)
        });
      });
    });
  }
}
