'use strict'

let isWildcard = require('./is_wildcard')

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

module.exports = function (wildcard, hostname) {
  if (!isWildcard(wildcard)) {
    return false
  }

  let baseDomain = wildcard.substring(2)
  let regex = new RegExp(`^[a-zA-Z0-9_-]+\\.${escapeRegExp(baseDomain)}$`)
  return hostname.match(regex)
}
