import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

export default class SessionsIndex extends Command {
  static description = 'list your OAuth sessions'
  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(SessionsIndex)
    const {platform} = createSDK(this.heroku)

    let sessions = await platform.oauthSession.list()

    sessions = sessions.sort((a, b) => {
      const descA = a.description || ''
      const descB = b.description || ''
      return descA.localeCompare(descB)
    })

    if (flags.json) {
      this.logJson(sessions)
    } else if (sessions.length === 0) {
      ux.stdout('No OAuth sessions.')
    } else {
      this.log(hux.table(sessions, {
        description: {
          get: (v: any) => color.info(v.description),
          header: 'Description',
        },
        id: {
          header: 'ID',
        },
      }))
    }
  }
}
