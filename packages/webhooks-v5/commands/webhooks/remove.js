const { Command, flags } = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../lib/webhook-type.js')

class Remove extends Command {
  async run () {
    const { flags, args } = this.parse(Remove)
    let { path, display } = webhookType(flags)
    await cli.action(`Removing webhook ${args.id} from ${display}`, {},
      this.heroku.delete(`${path}/webhooks/${args.id}`, {
        headers: { Accept: 'application/vnd.heroku+json; version=3.webhooks' }
      }
      ))
  }
}

Remove.description = 'removes a webhook from an app'

Remove.examples = [
  '$ heroku webhooks:remove 99999999-9999-9999-9999-999999999999'
]

Remove.flags = {
  app: flags.app(),
  remote: flags.remote(),
  pipeline: flags.string({ char: 'p', description: 'pipeline on which to list', hidden: true })
}

Remove.args = [
  { name: 'id', description: 'id of webhook to remove' }
]

module.exports = Remove
