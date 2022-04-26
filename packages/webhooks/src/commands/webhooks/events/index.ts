import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../../base'

export default class EventsIndex extends BaseCommand {
  static description = 'list webhook events on an app'

  static examples = [
    '$ heroku webhooks:events',
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
  }

  async run() {
    const {flags} = this.parse(EventsIndex)
    const {path, display} = this.webhookType(flags)

    cli.warn('heroku webhooks:event is deprecated, please use heroku webhooks:deliveries')

    const {body: events} = await this.webhooksClient.get(`${path}/webhook-events`)

    if (events.length === 0) {
      this.log(`${display} has no events`)
    } else {
      events.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

      cli.table(events, {
        id: {
          header: 'Event ID',
        },
        resource: {
          get: (w: any) => w.payload.resource,
        },
        action: {
          get: (w: any) => w.payload.action,
        },
        published_at: {
          header: 'Published At', get: (w: any) => w.payload.published_at,
        },
      }, {
        printLine: this.log,
      })
    }
  }
}
