import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../../base'

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
    num: flags.integer({char: 'n', description: 'number of deliveries to show (default: 20)'}),
  }

  async run() {
    const {flags} = this.parse(Deliveries)
    const webhookType = this.webhookType(flags)
    let {path} = webhookType
    const {display} = webhookType

    path = `${path}/webhook-deliveries`
    if (flags.status) {
      path += `?eq[status]=${encodeURIComponent(flags.status)}`
    }

    if (!flags.num) {
      flags.num = 20
    }
    const {body: deliveries, statusCode: status} = await this.webhooksClient.get(path, {
      headers: {
        Range: `seq ..; order=desc,max=${flags.num}`,
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

      if (status === 206) {
        this.warn(`Only showing the ${flags.num} most recent deliveries`)
        this.warn('It is possible to filter deliveries by using the --status flag')
      }

      cli.table(deliveries, {
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
        printLine: this.log,
      })
    }
  }
}
