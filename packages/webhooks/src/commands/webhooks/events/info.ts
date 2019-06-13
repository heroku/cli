import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../../webhook-type'

export default class Info extends Command {
  static description = 'info for a webhook event on an app'

  static examples = [
    '$ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [
    {name: 'id'}
  ]

  async run() {
    const {flags, args} = this.parse(Info)
    const {path} = webhookType(flags)

    cli.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')

    let {body} = await this.heroku.get(`${path}/webhook-events/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    let webhookEvent = body

    let obj = {
      payload: JSON.stringify(webhookEvent.payload, null, 2)
    }

    cli.styledHeader(webhookEvent.id)
    cli.styledObject(obj)
  }
}
