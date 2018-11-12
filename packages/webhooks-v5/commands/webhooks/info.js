const { Command, flags } = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../lib/webhook-type.js')

class Info extends Command {
  async run () {
    const { flags, args } = this.parse(Info)
    let { path } = webhookType(flags)

    let { body } = await this.heroku.get(`${path}/webhooks/${args.id}`, {
      headers: { Accept: 'application/vnd.heroku+json; version=3.webhooks' }
    })
    let webhook = body

    let obj = {
      'Webhook ID': webhook.id,
      URL: webhook.url,
      Include: webhook.include.join(','),
      Level: webhook.level
    }

    cli.styledHeader(webhook.id)
    cli.styledObject(obj)
  }
}

Info.description = 'info for a webhook on an app'

Info.examples = [
  '$ heroku webhooks:info 99999999-9999-9999-9999-999999999999'
]

Info.flags = {
  app: flags.app(),
  remote: flags.remote(),
  pipeline: flags.string({ char: 'p', description: 'pipeline on which to list', hidden: true })
}

Info.args = [
  { name: 'id' }
]

module.exports = Info
