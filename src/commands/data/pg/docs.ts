import {hux} from '@heroku/heroku-cli-util'
import {flags} from '@heroku-cli/command'

import BaseCommand from '../../../lib/data/baseCommand.js'

export default class DataPgDocs extends BaseCommand {
  static defaultUrl = 'https://devcenter.heroku.com/categories/heroku-postgres'
  static description = 'open documentation for Heroku Postgres in your web browser'
  static flags = {
    browser: flags.string({description: 'browser to open docs with (example: "firefox", "safari")'}),
  }

  public async openUrl(url: string, browser: string, description: string): Promise<void> {
    await hux.openUrl(url, browser, description)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgDocs)
    const {browser} = flags
    const url = DataPgDocs.defaultUrl

    await this.openUrl(url, browser, 'view the documentation')
  }
}
