import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {Domain} from '../types/domain'

async function * customDomainCreationComplete(app: string, heroku: APIClient): AsyncGenerator<Domain[] | null> {
  let retries = 30
  while (retries--) {
    // eslint-disable-next-line no-await-in-loop
    const {body: apiDomains} = await heroku.get<Domain[]>(`/apps/${app}/domains`)
    const someNull = apiDomains.some((domain: Domain) => domain.kind === 'custom' && !domain.cname)
    if (!someNull) {
      yield apiDomains
      break
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => {
      setTimeout(resolve, 1000)
    })

    yield null
  }
}

export async function waitForDomains(app: string, heroku: APIClient): Promise<Domain[]> {
  ux.action.start('Waiting for stable domains to be created')
  for await (const apiDomains of customDomainCreationComplete(app, heroku)) {
    if (apiDomains) {
      ux.action.stop()
      return apiDomains
    }
  }

  ux.action.stop('!')
  throw new Error('Timed out while waiting for stable domains to be created')
}
