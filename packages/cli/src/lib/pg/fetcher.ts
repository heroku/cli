import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export async function getRelease(heroku: APIClient, appName: string, id: string) {
  const {body: release} = await heroku.get<Heroku.Release>(`/apps/${appName}/releases/${id}`)
  return release
}
