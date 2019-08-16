import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {OAuthSession} from '../../lib/sessions'
const sortBy = require('lodash.sortby')

export default class SessionsIndex extends Command {
  static description = 'list your OAuth sessions'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {flags} = this.parse(SessionsIndex)

    let {body: sessions} = await this.heroku.get<Array<OAuthSession>>('/oauth/sessions')

    sessions = sortBy(sessions, 'description')

    if (flags.json) {
      cli.styledJSON(sessions)
    } else if (sessions.length === 0) {
      cli.log('No OAuth sessions.')
    } else {
      cli.table(sessions, {
        description: {get: (v: any) => color.green(v.description)},
        id: {},
      }, {'no-header': true, printLine: this.log})
    }
  }
}
