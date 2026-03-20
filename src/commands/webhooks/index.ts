import {flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import BaseCommand from '../../lib/webhooks/base.js'

export default class Webhooks extends BaseCommand {
  static description = 'list webhooks on an app'

  static examples = [`${color.command('heroku webhooks')}`]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({
      char: 'p',
      description:
      'pipeline on which to list',
      hidden: true,
    }),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(Webhooks)
    const {display, path} = this.webhookType(flags)

    const {body: webhooks}: {body: any} = await this.webhooksClient.get(`${path}/webhooks`)

    if (webhooks.length === 0) {
      ux.stdout(`${display} has no webhooks\nUse ${color.command('heroku webhooks:add')} to add one.`)
      return
    }

    webhooks.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

    /* eslint-disable perfectionist/sort-objects */
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
    /* eslint-enable perfectionist/sort-objects */
  }
}
