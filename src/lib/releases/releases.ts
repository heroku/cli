import {HerokuSDK} from '@heroku/sdk'
import {Release} from '@heroku/types/3.sdk'

type Platform = HerokuSDK['platform']

export const findRelease = async function (platform: Platform, app: string, search: (releases: Release[]) => Release) {
  const releases = await platform
    .withHeaders({Range: 'version ..; max=10, order=desc'})
    .release.list(app)

  return search(releases)
}

export const getRelease = async function (platform: Platform, app: string, release: string) {
  let id = release.toLowerCase()
  id = id.startsWith('v') ? id.slice(1) : id

  const releaseResponse = platform.release.info(app, id)
  return releaseResponse
}

export const findByLatestOrId = async function (platform: Platform, app: string, release = 'current') {
  if (release === 'current') {
    return findRelease(platform, app, releases => releases[0])
  }

  return getRelease(platform, app, release)
}

export const findByPreviousOrId = async function (platform: Platform, app: string, release = 'previous') {
  if (release === 'previous') {
    return findRelease(platform, app, releases => releases.filter(r => r.eligible_for_rollback)[1])
  }

  return getRelease(platform, app, release)
}
