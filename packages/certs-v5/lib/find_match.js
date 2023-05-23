'use strict'

let _ = require('lodash')
let isWildcardMatch = require('./is_wildcard_match')

let stableCnames = ['.herokudns.com', '.herokudnsdev.com']

function matches(match) {
  return match && (match.kind === 'heroku' || _.find(stableCnames, stableCname => match.cname.endsWith(stableCname)))
}

module.exports = function (certDomain, domains) {
  let exactMatch = _.find(domains, domain => certDomain === domain.hostname)
  if (matches(exactMatch)) {
    return exactMatch
  }

  let wildcardMatch = _.find(domains, function (domain) {
    return (domain.hostname && isWildcardMatch(domain.hostname, certDomain))
  })

  if (matches(wildcardMatch)) {
    return wildcardMatch
  }

  return null
}
