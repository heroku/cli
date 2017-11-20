'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../lib/webhook_type.js')

let secret = null

function secretMiddleware (middleware) {
  return function (response, cb) {
    secret = response.headers['heroku-webhook-secret']
    if (middleware) {
      middleware(response, cb)
    } else {
      cb()
    }
  }
}

function addSecretMiddleware (heroku) {
  let middleware = heroku.options.middleware.bind(heroku)
  heroku.options.middleware = secretMiddleware(middleware)
}

function * run (context, heroku) {
  addSecretMiddleware(heroku)

  let {path, display} = webhookType(context)

  yield cli.action(`Adding webhook to ${display}`, {},
    heroku.post(`${path}/webhooks`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
      body: {
        include: context.flags.include.split(',').map((s) => s.trim()),
        level: context.flags.level,
        secret: context.flags.secret,
        url: context.flags.url,
        authorization: context.flags.authorization
      }
    }
  ))

  if (secret) {
    cli.styledHeader('Webhooks Signing Secret')
    cli.log(secret)
  }
}

module.exports = {
  topic: 'webhooks',
  command: 'add',
  flags: [
    {name: 'include', char: 'i', description: 'comma delimited event types your server will receive ', hasValue: true, required: true},
    {name: 'level', char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', hasValue: true, required: true},
    {name: 'secret', char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header', hasValue: true},
    {name: 'authorization', char: 't', description: 'authoriation header to send with webhooks', hasValue: true},
    {name: 'url', char: 'u', description: 'URL for receiver', hasValue: true, required: true},
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to add', hidden: true}
  ],
  description: 'add a webhook to an app',
  help: `Example:

 $ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks
`,
  wantsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
