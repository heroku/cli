import {flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import BaseCommand from '../../../lib/webhooks/base'

export default class Deliveries extends BaseCommand {
  static description = 'list webhook deliveries on an app'

  static examples = [
    '$ heroku webhooks:deliveries',
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    status: flags.string({char: 's', description: 'filter deliveries by status'}),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
  }

  async run() {
    const {flags} = await this.parse(Deliveries)
    const webhookType = this.webhookType(flags)
    let {path} = webhookType
    const {display} = webhookType
    const max = 1000

    path = `${path}/webhook-deliveries`
    if (flags.status) {
      path += `?eq[status]=${encodeURIComponent(flags.status)}`
    }

    const {body: deliveries}: { body: any[]} = await this.webhooksClient.get(path, {
      headers: {
        Range: `seq ..; order=desc,max=${max}`,
      },
      partial: true,
    })

    if (deliveries.length === 0) {
      this.log(`${display} has no deliveries`)
    } else {
      const code = (w: any) => {
        return (w.last_attempt && w.last_attempt.code && String(w.last_attempt.code)) || ''
      }

      deliveries.reverse()

      if (deliveries.length === max) {
        this.warn(`Only showing the ${max} most recent deliveries`)
        this.warn('It is possible to filter deliveries by using the --status flag')
      }

      const printLine: typeof this.log = (...args) => this.log(...args)
      ux.table(deliveries, {
        id: {
          header: 'Delivery ID',
        },
        created_at: {
          header: 'Created', get: (w: any) => w.created_at,
        },
        status: {
          get: (w: any) => w.status,
        },
        include: {
          get: (w: any) => w.event.include,
        },
        level: {
          get: (w: any) => w.webhook.level,
        },
        num_attempts: {
          header: 'Attempts', get: (w: any) => String(w.num_attempts),
        },
        last_code: {
          header: 'Code', get: code,
        },
        last_error: {
          header: 'Error', get: (w: any) => (w.last_attempt && w.last_attempt.error_class) || '',
        },
        next_attempt_at: {
          header: 'Next Attempt', get: (w: any) => w.next_attempt_at || '',
        },
      }, {
        'no-header': false, printLine,
      })
    }
  }
}
