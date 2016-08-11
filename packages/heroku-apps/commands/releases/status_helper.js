'use strict'

function pendingDescription (release, runningRelease, runningSlug) {
  if (runningRelease && runningRelease.id === release.id && runningSlug.process_types && runningSlug.process_types.release) {
    return 'release command executing'
  } else {
    return 'pending'
  }
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
