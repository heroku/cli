'use strict'

module.exports = function (hostname) {
  // eslint-disable-next-line unicorn/prefer-string-slice
  return hostname.substring(0, 2) === '*.'
}
