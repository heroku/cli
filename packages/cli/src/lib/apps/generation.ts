import {APIClient} from '@heroku-cli/command'
import {App} from '../types/fir'

async function getApp(appOrName: App | string, herokuApi?: APIClient): Promise<App> {
  if (typeof appOrName === 'string') {
    if (herokuApi === undefined)
      throw new Error('herokuApi parameter is required when passing an app name')

    const {body: app} = await herokuApi.get<App>(
      `/apps/${appOrName}`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
      })
    return app
  }

  return appOrName
}

export async function isFirApp(appOrName: App | string, herokuApi?: APIClient) {
  const app = await getApp(appOrName, herokuApi)
  return app.generation.name === 'fir'
}

export async function isCedarApp(appOrName: App | string, herokuApi?: APIClient) {
  const app = await getApp(appOrName, herokuApi)
  return app.generation.name === 'cedar'
}
