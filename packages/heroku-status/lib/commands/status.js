// TODO: Fix this in status.

// 1. The response should be lower case (Development -> development)
// 2. I should add an endpoint that returns the possible status colors (red, yellow, green...) (?)

var api = require('request').defaults({
  json: true,
  headers: { 'Accept': 'application/vnd.heroku+json;' }
});

var colors = require('colors');

function printStatus(status, incidents) {
  var message;
  var color = colors.green;
  switch(status) {
    case 'green':
      color = colors.green;
      message =  'No known issues at this time.';
      break;
    case 'red':
      color = colors.red;
      // TODO: Grab message from incidents, and do something with it.
      break;
    case 'yellow': // ?
      color = color.yellow;
      // TODO: Grab message from incidents, and do something with it.
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
      console.log('Development: %s', printStatus(response.status.Development, response.issues));
      console.log('Production: %s', printStatus(response.status.Production, response.issues));
    });
  }
}
