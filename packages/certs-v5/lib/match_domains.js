'use strict'

function splitDomains(domains) {
  return domains.map(domain => {
    // eslint-disable-next-line unicorn/prefer-string-slice
    return [domain.substring(0, 1), domain.substring(1)]
  })
}

function createMatcherFromSplitDomain([firstChar, rest]) {
  const matcherContents = []
  if (firstChar === '*') {
    matcherContents.push('^[\\w\\-]+')
  } else {
    matcherContents.push(firstChar)
  }

  const escapedRest = rest.replace(/\./g, '\\.')

  matcherContents.push(escapedRest)

  return new RegExp(matcherContents.join(''))
}

function includesWildcard(domains) {
  if (domains.some(domain => (domain[0] === '*'))) {
    return true
  }

  return false
}

module.exports = function (certDomains, appDomains) {
  const splitCertDomains = splitDomains(certDomains)
  const matchers = splitCertDomains.map(splitDomain => createMatcherFromSplitDomain(splitDomain))

  if (includesWildcard(splitCertDomains)) {
    // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prevent-abbreviations
    const matchedDomains = appDomains.reduce((acc, appDomain) => {
      if (matchers.some(matcher => matcher.test(appDomain))) {
        acc.push(appDomain)
      }

      return acc
    }, [])

    return matchedDomains
  // eslint-disable-next-line no-else-return
  } else {
    return certDomains.filter(domain => appDomains.includes(domain))
  }
}
