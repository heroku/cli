const {Command, flags} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../../lib/webhook_type.js')

class Info extends Command {
  async run() {
    const {flags, args} = this.parse(Info)
    cli.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')
    let {path} = webhookType(flags)

    let {body} = await this.heroku.get(`${path}/webhook-events/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    })
    let webhookEvent = body

    let obj = {
      payload: JSON.stringify(webhookEvent.payload, null, 2),
    }

    cli.styledHeader(webhookEvent.id)
    cli.styledObject(obj)
  }
}

Info.description = 'info for a webhook event on an app'

Info.examples = [
  '$ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999',
]

Info.flags = {
  app: flags.app({char: 'a'}),
  pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true}),
}

Info.args = [
  {name: 'id'},
]

module.exports = Info
