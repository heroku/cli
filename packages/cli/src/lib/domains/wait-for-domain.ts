import {color} from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'

export default async function waitForDomain(app: string, heroku: APIClient, domain: Heroku.Domain) {
  ux.action.start(`Waiting for ${color.green(domain.hostname || 'domain')}`)
  while (domain.status === 'pending') {
    await hux.wait(5000)
    const {body: updatedDomain} = await heroku.get<Heroku.Domain>(`/apps/${app}/domains/${domain.id}`)
    domain = updatedDomain
  }

  ux.action.stop()
  if (domain.status === 'succeeded' || domain.status === 'none') return
  throw new Error(`The domain creation finished with status ${domain.status}`)
}
