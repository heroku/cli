'use strict';

let cli     = require('heroku-cli-util');

module.exports = function(endpoint) {
  let warnings = endpoint.warnings;
  if (warnings) {
    for (var field in warnings) {
      if (warnings.hasOwnProperty(field)) {
        cli.warn(`${field} ${endpoint.warnings[field]}`);
      }
    }
  }
};


