import type {APIClient} from '@heroku-cli/command'
import type {HTTP} from 'http-call'

const responseByAppId: Map<string, Promise<HTTP<Record<string, string>>>> = new Map()

export async function getConfig(heroku: APIClient, app: string): Promise<Record<string, string> | undefined> {
  if (!responseByAppId.has(app)) {
    const promise = heroku.get<Record<string, string>>(`/apps/${app}/config-vars`)
    responseByAppId.set(app, promise)
  }

  const result = await responseByAppId.get(app)
  return result?.body
}

