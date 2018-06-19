const {Command, flags} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../lib/webhook_type.js')

class Add extends Command {
  async run() {
    const {flags} = this.parse(Add)
    let {path, display} = webhookType(flags)

    let secret = await cli.action(`Adding webhook to ${display}`, new Promise(async resolve => {
      let {response} = await this.heroku.post(`${path}/webhooks`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
        body: {
          include: flags.include.split(',').map(s => s.trim()),
          level: flags.level,
          secret: flags.secret,
          url: flags.url,
          authorization: flags.authorization,
        },
      })
      let secret
      if (response.headers) secret = response.headers['heroku-webhook-secret']
      resolve(secret)
    }))

    if (secret) {
      cli.styledHeader('Webhooks Signing Secret')
      cli.log(secret)
    }
  }
}

Add.description = 'add a webhook to an app'

Add.examples = [
  '$ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks',
]

Add.flags = {
  app: flags.app({char: 'a'}),
  pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true}),
  include: flags.string({char: 'i', description: 'comma delimited event types your server will receive ', required: true}),
  level: flags.string({char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true}),
  secret: flags.string({char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header'}),
  authorization: flags.string({char: 't', description: 'authoriation header to send with webhooks'}),
  url: flags.string({char: 'u', description: 'URL for receiver', required: true}),
}

module.exports = Add
