'use strict';

let ssl_endpoints = require('./endpoints.js').endpoints;
let error = require('./error.js');

module.exports = function*(context, heroku) {
  if (context.flags.endpoint && context.flags.name) {
    error.exit(1, 'Specified both --name and --endpoint, please use just one');
  }

  let ssl_endpoints_all = yield ssl_endpoints(context.app, heroku);

  var endpoints = ssl_endpoints_all.all;

  if (endpoints.length === 0) {
    error.exit(1, `${context.app} has no SSL endpoints`);
  }

  if (context.flags.endpoint) {
    endpoints = endpoints.filter(function(endpoint) {
      return endpoint.cname === context.flags.endpoint;
    });

    if (endpoints.length > 1) {
      error.exit(1, 'Must pass --name when more than one endpoint matches --endpoint');
    }
  }

  if (context.flags.name) {
    endpoints = endpoints.filter(function(endpoint) {
      return endpoint.name === context.flags.name;
    });

    if (endpoints.length > 1) {
      error.exit(1, `More than one endpoint matches ${context.flags.name}, please file a support ticket`);
    }
  }

  if (endpoints.length > 1) {
    error.exit(1, 'Must pass --name when more than one endpoint');
  }

  if (endpoints.length === 0) {
    error.exit(1, 'Record not found.');
  }

  return {endpoint: endpoints[0], endpoints: ssl_endpoints_all};
};
