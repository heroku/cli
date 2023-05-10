'use strict'

function splitDomains(domains) {
  return domains.map(domain => {
    return [domain.slice(0, 1), domain.slice(1)]
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
    // eslint-disable-next-line unicorn/prevent-abbreviations
    const matchedDomains = appDomains.reduce((acc, appDomain) => {
      if (matchers.some(matcher => matcher.test(appDomain))) {
        acc.push(appDomain)
      }

      return acc
    }, [])

    return matchedDomains
  }

  return certDomains.filter(domain => appDomains.includes(domain))
}
