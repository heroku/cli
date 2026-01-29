import {color, hux} from '@heroku/heroku-cli-util'
import {flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import BaseCommand from '../../lib/webhooks/base.js'

export default class Webhooks extends BaseCommand {
  static description = 'list webhooks on an app'

  static examples = ['$ heroku webhooks']

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({
      char: 'p',
      description:
      'pipeline on which to list',
      hidden: true,
    }),
  }

  async run() {
    const {flags} = await this.parse(Webhooks)
    const {path, display} = this.webhookType(flags)

    const {body: webhooks}: {body: any} = await this.webhooksClient.get(`${path}/webhooks`)

    if (webhooks.length === 0) {
      ux.stdout(`${display} has no webhooks\nUse ${color.command('heroku webhooks:add')} to add one.`)
      return
    }

    webhooks.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

    hux.table(webhooks, {
      id: {
        header: 'Webhook ID',
      },
      url: {
        header: 'URL',
      },
      include: {
        header: 'Include',
        get: (row: any) => row.include.join(','),
      },
      level: {
        header: 'Level',
      },
    })
  }
}
