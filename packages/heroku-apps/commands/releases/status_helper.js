'use strict'

function pendingDescription (release, runningRelease, runningSlug) {
  if (runningRelease && runningRelease.id === release.id && hasReleasePhase(runningSlug)) {
    return 'release command executing'
  } else {
    return 'pending'
  }
}

function hasReleasePhase (slug) {
  return slug &&
    slug.process_types &&
    slug.process_types.release
}

module.exports.description = function (release, runningRelease, runningSlug) {
  switch (release.status) {
    case 'pending':
      return pendingDescription(release, runningRelease, runningSlug)
    case 'failed':
      return 'release command failed'
    default:
      return
  }
}

module.exports.color = function (s) {
  switch (s) {
    case 'pending':
      return 'yellow'
    case 'failed':
      return 'red'
    default:
      return 'white'
  }
}
