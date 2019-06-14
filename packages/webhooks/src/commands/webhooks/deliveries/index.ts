import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../../webhook-type'

export default class Deliveries extends Command {
  static description = 'list webhook deliveries on an app'

  static examples = [
    '$ heroku webhooks:deliveries'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    status: flags.string({char: 's', description: 'filter deliveries by status'}),
    pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

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
        Range: `seq ..; order=desc,max=${max}`
      },
      partial: true
    })
    let deliveries = body

    if (deliveries.length === 0) {
      cli.log(`${display} has no deliveries`)
    } else {
      let code = (w: any) => {
        return (w.last_attempt && w.last_attempt.code && String(w.last_attempt.code)) || ''
      }

      deliveries.reverse()

      if (deliveries.length === max) {
        this.warn(`Only showing the ${max} most recent deliveries`)
        this.warn('It is possible to filter deliveries by using the --status flag')
      }

      cli.table(deliveries, {
        id: {header: 'Delivery ID'},
        created_at: {header: 'Created', get: (w: any) => w.created_at},
        status: {header: 'Status', get: (w: any) => w.status},
        include: {header: 'Include', get: (w: any) => w.event.include},
        level: {header: 'Level', get: (w: any) => w.webhook.level},
        num_attempts: {header: 'Attempts', get: (w: any) => String(w.num_attempts)},
        last_code: {header: 'Code', get: code},
        last_error: {header: 'Error', get: (w: any) => (w.last_attempt && w.last_attempt.error_class) || ''},
        next_attempt_at: {header: 'Next Attempt', get: (w: any) => w.next_attempt_at || ''}
      })
    }
  }
}
