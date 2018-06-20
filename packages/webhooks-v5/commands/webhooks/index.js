const {Command, flags} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../lib/webhook-type.js')

class Webhooks extends Command {
  async run () {
    const {flags} = this.parse(Webhooks)
    let {path, display} = webhookType(flags)

    let {body} = await this.heroku.get(`${path}/webhooks`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    let webhooks = body

    if (webhooks.length === 0) {
      cli.log(`${display} has no webhooks\nUse ${cli.color.cmd('heroku webhooks:add')} to add one.`)
      return
    }

    webhooks.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))

    cli.table(webhooks, {columns: [
      {key: 'id', label: 'Webhook ID'},
      {key: 'url', label: 'URL'},
      {key: 'include', label: 'Include'},
      {key: 'level', label: 'Level'}
    ]})
  }
}

Webhooks.description = 'list webhooks on an app'

Webhooks.examples = [
  '$ heroku webhooks'
]

Webhooks.flags = {
  app: flags.app({char: 'a'}),
  pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
}

module.exports = Webhooks
