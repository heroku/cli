import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../webhook-type'

export default class Webhooks extends Command {
  static description = 'list webhooks on an app'

  static examples = ['$ heroku webhooks']

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({
      char: 'p',
      description:
      'pipeline on which to list',
      hidden: true
    })
  }

  async run() {
    const {flags} = this.parse(Webhooks)
    const {path, display} = webhookType(flags)

    const {body} = await this.heroku.get(`${path}/webhooks`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    const webhooks = body

    if (webhooks.length === 0) {
      cli.log(`${display} has no webhooks\nUse ${color.cmd('heroku webhooks:add')} to add one.`)
      return
    }

    webhooks.sort((a: any, b: any) => Date.parse(a.created_at) - Date.parse(b.created_at))

    cli.table(webhooks, {
      id: {header: 'Webhook ID'},
      url: {header: 'URL'},
      include: {header: 'Include', get: (row: any) => row.include.join(',')},
      level: {header: 'Level'}
    }, {
      printLine: this.log
    })
  }
}
