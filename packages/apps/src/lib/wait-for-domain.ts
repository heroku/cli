import {CliUx} from '@oclif/core'
import {color} from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default async function waitForDomain(app: string, heroku: APIClient, domain: Heroku.Domain) {
  CliUx.ux.action.start(`Waiting for ${color.green(domain.hostname || 'domain')}`)
  while (domain.status === 'pending') {
    // eslint-disable-next-line no-await-in-loop
    await CliUx.ux.wait(5000)
    // eslint-disable-next-line no-await-in-loop
    const {body: updatedDomain} = await heroku.get<Heroku.Domain>(`/apps/${app}/domains/${domain.id}`)
    domain = updatedDomain
  }
  CliUx.ux.action.stop()
  if (domain.status === 'succeeded' || domain.status === 'none') return
  throw new Error(`The domain creation finished with status ${domain.status}`)
}
