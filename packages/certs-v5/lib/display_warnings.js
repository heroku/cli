'use strict'

let cli = require('heroku-cli-util')

module.exports = function (endpoint) {
  let warnings = endpoint.warnings
  if (warnings) {
    for (var field in warnings) {
      if (warnings.hasOwnProperty(field) && endpoint.warnings[field].length > 0) {
        cli.warn(`WARNING: ${field} ${endpoint.warnings[field]}`)
      }
    }
  }
}
