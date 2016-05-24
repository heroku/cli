'use strict'

let _ = require('lodash')

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

let stableCnames = ['.herokudns.com', '.herokudnsdev.com']

function matches (match) {
  return match && _.find(stableCnames, (stableCname) => match.cname.endsWith(stableCname))
}

module.exports = function (certDomain, domains) {
  let exactMatch = _.find(domains, (domain) => certDomain === domain.hostname)
  if (matches(exactMatch)) {
    return exactMatch.cname
  }

  let wildcardMatch = _.find(domains, function (domain) {
    if (domain.hostname && domain.hostname.substring(0, 2) === '*.') {
      let baseCertDomain = domain.hostname.substring(2)
      let regex = new RegExp(`^[a-zA-Z0-9_-]+\\.${escapeRegExp(baseCertDomain)}$`)
      return certDomain.match(regex)
    }

    return false
  })

  if (matches(wildcardMatch)) {
    return wildcardMatch.cname
  }

  return null
}
