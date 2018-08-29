const { Command, flags } = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../lib/webhook-type.js')

class Update extends Command {
  async run () {
    const { flags, args } = this.parse(Update)
    let { path, display } = webhookType(flags)
    await cli.action(`Updating webhook ${args.id} for ${display}`, {},
      this.heroku.patch(`${path}/webhooks/${args.id}`, {
        headers: { Accept: 'application/vnd.heroku+json; version=3.webhooks' },
        body: {
          include: flags.include && flags.include.split(',').map(s => s.trim()),
          level: flags.level,
          secret: flags.secret,
          url: flags.url
        }
      })
    )
  }
}

Update.description = 'updates a webhook in an app'

Update.examples = [
  '$ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks'
]

Update.flags = {
  app: flags.app({ char: 'a' }),
  pipeline: flags.string({ char: 'p', description: 'pipeline on which to list', hidden: true }),
  include: flags.string({ char: 'i', description: 'comma delimited event types your server will receive ', required: true }),
  level: flags.string({ char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true }),
  secret: flags.string({ char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header' }),
  authorization: flags.string({ char: 't', description: 'authoriation header to send with webhooks' }),
  url: flags.string({ char: 'u', description: 'URL for receiver', required: true })
}

Update.args = [
  { name: 'id' }
]

module.exports = Update

//
// 'use strict'
//
// let co = require('co')
// let cli = require('heroku-cli-util')
// let webhookType = require('../../lib/webhook-type.js')
//
// function * run(context, heroku) {
//   let {path, display} = webhookType(context)
//   yield cli.action(`Updating webhook ${context.args.id} for ${display}`, {},
//     heroku.patch(`${path}/webhooks/${context.args.id}`, {
//       headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
//       body: {
//         include: context.flags.include && context.flags.include.split(',').map(s => s.trim()),
//         level: context.flags.level,
//         secret: context.flags.secret,
//         url: context.flags.url,
//       },
//     }
//     ))
// }
//
// module.exports = {
//   topic: 'webhooks',
//   command: 'update',
//   args: [
//     {name: 'id', description: 'id of webhook to remove'},
//   ],
//   flags: [
//     {name: 'include', char: 'i', description: 'comma delimited webhook types', hasValue: true},
//     {name: 'level', char: 'l', description: 'webhook notification level', hasValue: true},
//     {name: 'secret', char: 's', description: 'comma delimited hook types', hasValue: true},
//     {name: 'url', char: 'u', description: 'url to send webhook to', hasValue: true},
//     {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to remove', hidden: true},
//   ],
//   description: 'updates a webhook in an app',
//   help: `Example:
//
//  $ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks
// `,
//   wantsApp: true,
//   needsAuth: true,
//   run: cli.command(co.wrap(run)),
// }
