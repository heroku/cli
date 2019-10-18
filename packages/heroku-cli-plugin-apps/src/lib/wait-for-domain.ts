import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

export default async function waitForDomain(app: string, heroku: any, domain: Heroku.Domain) {
  cli.action.start(`Waiting for ${color.green(domain.hostname || 'domain')}`)
  while (domain.status === 'pending') {
    await cli.wait(5000)
    domain = await heroku.get(`/apps/${app}/domains/${domain.id}`)
  }
  cli.action.stop()
  if (domain.status === 'succeeded' || domain.status === 'none') return
  throw new Error(`The domain creation finished with status ${domain.status}`)
}
