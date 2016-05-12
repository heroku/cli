'use strict'

let _ = require('lodash')

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

let stableCname = '.herokudns.com'

module.exports = function (certDomain, domains) {
  let exactMatch = _.find(domains, (domain) => certDomain === domain.hostname)
  if (exactMatch && exactMatch.cname.endsWith(stableCname)) {
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

  if (wildcardMatch && wildcardMatch.cname.endsWith(stableCname)) {
    return wildcardMatch.cname
  }

  return null
}
