'use strict'

function unwrap (str) {
  return str.replace(/\n ▸ {3}/g, '')
}

module.exports = unwrap
