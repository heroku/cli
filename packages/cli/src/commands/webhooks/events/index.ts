import {hux} from '@heroku/heroku-cli-util'
import {flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import BaseCommand from '../../../lib/webhooks/base.js'

export default class EventsIndex extends BaseCommand {
  static description = 'list webhook events on an app'

  static examples = [
    '$ heroku webhooks:events',
  ]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(EventsIndex)
    const {display, path} = this.webhookType(flags)

    ux.warn('heroku webhooks:event is deprecated, please use heroku webhooks:deliveries')

    const {body: events}: {body: any} = await this.webhooksClient.get(`${path}/webhook-events`)

    if (events.length === 0) {
      this.log(`${display} has no events`)
    } else {
      events.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

      const printLine: typeof this.log = (...args) => this.log(...args)

      /* eslint-disable perfectionist/sort-objects */
      hux.table(events, {
        id: {
          header: 'Event ID',
        },
        resource: {
          header: 'Resource',
          get: (w: any) => w.payload.resource,
        },
        action: {
          header: 'Action',
          get: (w: any) => w.payload.action,
        },
        published_at: {
          header: 'Published At',
          get: (w: any) => w.payload.published_at,
        },
      }, {
        printLine,
      })
    }
  }
}
