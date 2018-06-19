'use strict'

let allEndpoints = require('./endpoints.js').all
let error = require('./error.js')

module.exports = function * (context, heroku) {
  if (context.flags.endpoint && context.flags.name) {
    error.exit(1, 'Specified both --name and --endpoint, please use just one')
  }

  var endpoints = yield allEndpoints(context.app, heroku)

  if (endpoints.length === 0) {
    error.exit(1, `${context.app} has no SSL certificates`)
  }

  if (context.flags.endpoint) {
    endpoints = endpoints.filter(function (endpoint) {
      return endpoint.cname === context.flags.endpoint
    })

    if (endpoints.length > 1) {
      error.exit(1, 'Must pass --name when more than one endpoint matches --endpoint')
    }
  }

  if (context.flags.name) {
    endpoints = endpoints.filter(function (endpoint) {
      return endpoint.name === context.flags.name
    })

    if (endpoints.length > 1) {
      error.exit(1, `More than one endpoint matches ${context.flags.name}, please file a support ticket`)
    }
  }

  if (endpoints.length > 1) {
    error.exit(1, 'Must pass --name when more than one endpoint')
  }

  if (endpoints.length === 0) {
    error.exit(1, 'Record not found.')
  }

  return endpoints[0]
}
