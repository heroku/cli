'use strict'

module.exports = function (hostname) {
  return hostname.slice(0, 2) === '*.'
}
