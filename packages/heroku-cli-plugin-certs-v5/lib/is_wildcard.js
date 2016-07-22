'use strict'

module.exports = function (hostname) {
  return hostname.substring(0, 2) === '*.'
}
