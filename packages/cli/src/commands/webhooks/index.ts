import color from '@heroku-cli/color'
import {flags} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import BaseCommand from '../../lib/webhooks/base'

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
      this.log(`${display} has no webhooks\nUse ${color.cmd('heroku webhooks:add')} to add one.`)
      return
    }

    webhooks.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

    const printLine: typeof this.log = (...args) => this.log(...args)
    CliUx.ux.table(webhooks, {
      id: {
        header: 'Webhook ID',
      },
      url: {
        header: 'URL',
      },
      include: {
        get: (row: any) => row.include.join(','),
      },
      level: {},
    }, {
      'no-header': false, printLine,
    })
  }
}
