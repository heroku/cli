import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {SDK_HEADER} from '../../lib/api.js'

type OutsideCollaborator = {
  app: {id: string; name: string}
  created_at: string
  id: string
  updated_at: string
  user: {email: string; federated: boolean; id: string;}
}

export default class OutsideCollaborators extends Command {
  static description = 'list outside collaborators for an enterprise account'
  static flags = {
    'enterprise-account': flags.string({char: 'e', description: 'enterprise account name', required: true}),
    json: flags.boolean({description: 'output in json format'}),
  }
  static topic = 'enterprises'

  public async run(): Promise<void> {
    const {flags} = await this.parse(OutsideCollaborators)
    const enterpriseAccount = flags['enterprise-account']

    const {body: collaborators} = await this.heroku.get<OutsideCollaborator[]>(
      `/enterprise-accounts/${enterpriseAccount}/outside-collaborators`,
      {headers: {Accept: SDK_HEADER}},
    )

    if (flags.json) {
      // JSON output is a faithful passthrough of the API response (raw, unsorted).
      ux.stdout(JSON.stringify(collaborators, null, 3))
      return
    }

    // The human-readable table is sorted by email for legibility.
    const sorted = [...collaborators].sort((a, b) => a.user.email.localeCompare(b.user.email))

    if (sorted.length === 0) {
      ux.stdout(`No outside collaborators in ${color.name(enterpriseAccount)}`)
    } else {
      hux.table(sorted, {
        app: {
          get: ({app}: OutsideCollaborator): string => color.app(app.name),
        },
        email: {
          get: ({user}: OutsideCollaborator): string => color.user(user.email),
        },
        federated: {
          get: ({user}: OutsideCollaborator): string => (user.federated ? 'yes' : 'no'),
        },
      })
    }
  }
}
