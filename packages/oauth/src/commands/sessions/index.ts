import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import {OAuthSession} from '../../lib/sessions'
const sortBy = require('lodash.sortby')

export default class SessionsIndex extends Command {
  static description = 'list your OAuth sessions'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(SessionsIndex)

    let {body: sessions} = await this.heroku.get<Array<OAuthSession>>('/oauth/sessions')

    sessions = sortBy(sessions, 'description')

    if (flags.json) {
      CliUx.ux.styledJSON(sessions)
    } else if (sessions.length === 0) {
      CliUx.ux.log('No OAuth sessions.')
    } else {
      const printLine: typeof this.log = (...args) => this.log(...args)
      CliUx.ux.table(sessions, {
        description: {get: (v: any) => color.green(v.description)},
        id: {},
      }, {'no-header': true, printLine})
    }
  }
}
