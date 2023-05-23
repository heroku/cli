import {color} from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'
import Spinner from '@oclif/core/lib/cli-ux/action/spinner'

export default async function waitForDomain(app: string, heroku: APIClient, domain: Heroku.Domain) {
  const action = new Spinner()

  action.start(`Waiting for ${color.green(domain.hostname || 'domain')}`)
  while (domain.status === 'pending') {
    await CliUx.ux.wait(5000)
    const {body: updatedDomain} = await heroku.get<Heroku.Domain>(`/apps/${app}/domains/${domain.id}`)
    domain = updatedDomain
  }

  action.stop()
  if (domain.status === 'succeeded' || domain.status === 'none') return
  throw new Error(`The domain creation finished with status ${domain.status}`)
}
