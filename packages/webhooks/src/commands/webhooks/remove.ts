import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../webhook-type'
export default class WebhooksRemove extends Command {
  static description = 'removes a webhook from an app'

  static examples = [
    '$ heroku webhooks:remove 99999999-9999-9999-9999-999999999999'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [
    {name: 'id', description: 'id of webhook to remove'}
  ]

  async run() {
    const {flags, args} = this.parse(WebhooksRemove)
    let {path, display} = webhookType(flags)

    cli.action.start(`Removing webhook ${args.id} from ${display}`)

    await this.heroku.delete(`${path}/webhooks/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })

    cli.action.stop()
  }
}
