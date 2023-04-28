'use strict'

function unwrap(str) {
  let sanitize = str.replace(/\n ([▸!]) {3}/g, '')
  sanitize = sanitize.replace(/ ([▸!]) {4}/g, '')

  return sanitize
}

module.exports = unwrap
