import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export const findRelease = async function (heroku: APIClient, app: string, search: (releases: Heroku.Release[]) => Heroku.Release) {
  const {body: releases} = await heroku.request<Heroku.Release[]>(`/apps/${app}/releases`, {
    partial: true,
    headers: {Range: 'version ..; max=10, order=desc'},
  })

  return search(releases)
}

export const getRelease = async function (heroku: APIClient, app: string, release: string) {
  let id = release.toLowerCase()
  id = id.startsWith('v') ? id.slice(1) : id

  const {body: releaseResponse} = await heroku.get<Heroku.Release>(`/apps/${app}/releases/${id}`)

  return releaseResponse
}

export const findByLatestOrId = async function (heroku: APIClient, app: string, release = 'current') {
  if (release === 'current') {
    return findRelease(heroku, app, releases => releases[0])
  }

  return getRelease(heroku, app, release)
}

export const findByPreviousOrId = async function (heroku: APIClient, app: string, release = 'previous') {
  if (release === 'previous') {
    return findRelease(heroku, app, releases => releases.filter(r => r.status === 'succeeded')[1])
  }

  return getRelease(heroku, app, release)
}
