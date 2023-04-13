'use strict'

module.exports.description = function (release) {
  switch (release.status) {
  case 'pending':
    return 'release command executing'
  case 'failed':
    return 'release command failed'
  default:
  }
}

module.exports.color = function (s) {
  switch (s) {
  case 'pending':
    return 'yellow'
  case 'failed':
    return 'red'
  default:
    return 'white'
  }
}
