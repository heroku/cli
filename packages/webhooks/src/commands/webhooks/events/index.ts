import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../../webhook-type'

export default class EventsIndex extends Command {
  static description = 'list webhook events on an app'

  static examples = [
    '$ heroku webhooks:events'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  async run() {
    const {flags} = this.parse(EventsIndex)
    let {path, display} = webhookType(flags)

    cli.warn('heroku webhooks:event is deprecated, please use heroku webhooks:deliveries')

    let {body} = await this.heroku.get(`${path}/webhook-events`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    let events = body

    if (events.length === 0) {
      cli.log(`${display} has no events`)
    } else {
      events.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

      cli.table(events, {
        id: {header: 'Event ID'},
        resource: {header: 'Resource', get: (w: any) => w.payload.resource},
        action: {header: 'Action', get: (w: any) => w.payload.action},
        published_at: {header: 'Published At', get: (w: any) => w.payload.published_at}
      })
    }
  }
}
