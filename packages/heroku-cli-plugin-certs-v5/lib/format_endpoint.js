'use strict'

module.exports = function (endpoint) {
  let display = endpoint.name
  if (endpoint.cname) {
    display += ` (${endpoint.cname})`
  }
  return display
}
