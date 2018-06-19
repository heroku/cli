const {Command, flags} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../../lib/webhook_type.js')

class Events extends Command {
  async run() {
    const {flags} = this.parse(Events)
    cli.warn('heroku webhooks:event is deprecated, please use heroku webhooks:deliveries')
    let {path, display} = webhookType(flags)

    let {body} = await this.heroku.get(`${path}/webhook-events`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    })
    let events = body

    if (events.length === 0) {
      cli.log(`${display} has no events`)
    } else {
      events.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))

      cli.table(events, {columns: [
        {key: 'id', label: 'Event ID'},
        {key: 'resource', label: 'Resource', get: w => w.payload.resource},
        {key: 'action', label: 'Action', get: w => w.payload.action},
        {key: 'published_at', label: 'Published At', get: w => w.payload.published_at},
      ]})
    }
  }
}

Events.description = 'list webhook events on an app'

Events.examples = [
  '$ heroku webhooks:events',
]

Events.flags = {
  app: flags.app({char: 'a'}),
  pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true}),
}

module.exports = Events
