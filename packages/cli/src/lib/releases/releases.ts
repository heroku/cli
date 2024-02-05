import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export const findRelease = async function (heroku: APIClient, app: string, search: (releases: Heroku.Release[]) => Heroku.Release) {
  const {body: releases} = await heroku.request<Heroku.Release[]>(`/apps/${app}/releases`, {
    partial: true,
    headers: {Range: 'version ..; max=10, order=desc'},
  })

  return search(releases)
}

export const findByLatestOrId = async function (heroku: APIClient, app: string, release?: string) {
  let id = (release || 'current').toLowerCase()
  id = id.startsWith('v') ? id.slice(1) : id
  if (id === 'current') {
    return findRelease(heroku, app, releases => releases[0])
  }

  const {body: releaseResponse} = await heroku.get<Heroku.Release>(`/apps/${app}/releases/${id}`)

  return releaseResponse
}

