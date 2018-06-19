const {Command, flags} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../../lib/webhook_type.js')

class Deliveries extends Command {
  async run() {
    const {flags} = this.parse(Deliveries)
    let {path, display} = webhookType(flags)
    let max = 1000

    path = `${path}/webhook-deliveries`
    if (flags.status) {
      path += `?eq[status]=${encodeURIComponent(flags.status)}`
    }

    let {body} = await this.heroku.get(path, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.webhooks',
        Range: `seq ..; order=desc,max=${max}`,
      },
      partial: true,
    })
    let deliveries = body

    if (deliveries.length === 0) {
      cli.log(`${display} has no deliveries`)
    } else {
      let code = w => {
        return (w.last_attempt && w.last_attempt.code && String(w.last_attempt.code)) || ''
      }

      deliveries.reverse()

      if (deliveries.length === max) {
        cli.error(`Only showing the ${max} most recent deliveries`)
        cli.error('It is possible to filter deliveries by using the --status flag')
      }

      cli.table(deliveries, {columns: [
        {key: 'id', label: 'Delivery ID'},
        {key: 'created_at', label: 'Created', get: w => w.created_at},
        {key: 'status', label: 'Status', get: w => w.status},
        {key: 'include', label: 'Include', get: w => w.event.include},
        {key: 'level', label: 'Level', get: w => w.webhook.level},
        {key: 'num_attempts', label: 'Attempts', get: w => String(w.num_attempts)},
        {key: 'last_code', label: 'Code', get: code},
        {key: 'last_error', label: 'Error', get: w => (w.last_attempt && w.last_attempt.error_class) || ''},
        {key: 'next_attempt_at', label: 'Next Attempt', get: w => w.next_attempt_at || ''},
      ]})
    }
  }
}

Deliveries.description = 'list webhook deliveries on an app'

Deliveries.examples = [
  '$ heroku webhooks:deliveries',
]

Deliveries.flags = {
  app: flags.app({char: 'a'}),
  status: flags.string({char: 's', description: 'filter deliveries by status'}),
  pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true}),
}

module.exports = Deliveries
