import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

import {OAuthSession} from '../../lib/sessions/sessions.js'

export default class SessionsIndex extends Command {
  static description = 'list your OAuth sessions'

  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(SessionsIndex)

    let {body: sessions} = await this.heroku.get<Array<OAuthSession>>('/oauth/sessions')

    sessions = sessions.sort((a, b) => {
      const descA = a.description || ''
      const descB = b.description || ''
      return descA.localeCompare(descB)
    })

    if (flags.json) {
      hux.styledJSON(sessions)
    } else if (sessions.length === 0) {
      ux.stdout('No OAuth sessions.')
    } else {
      hux.table(sessions, {
        description: {get: (v: any) => color.green(v.description)},
        id: {},
      })
    }
  }
}
