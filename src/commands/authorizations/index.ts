import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'

import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsIndex extends Command {
  static description = 'list OAuth authorizations'
  static enableJsonFlag = true
  static examples = [
    color.command('heroku authorizations'),
  ]
  static flags = {
    team: flags.team({description: 'team to list OAuth authorizations for'}),
  }

  async run(): Promise<OauthAuthorization[]> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(AuthorizationsIndex)

    const authorizations = flags.team
      ? await platform.oauthAuthorization.teamList(flags.team)
      : await platform.oauthAuthorization.list()

    if (!this.jsonEnabled()) {
      if (authorizations.length === 0) {
        this.log('No OAuth authorizations.')
      } else {
        // The table sorts its own display rows (natural order), so --json returns the SDK
        // result unchanged (API order).
        const rows = authorizations.map(({description, id, scope}) => ({
          Description: color.name(description),
          ID: id,
          Scope: scope.join(','),
        }))

        this.log(hux.table(rows, {Description: {}, ID: {}, Scope: {}}, {sort: 'Description'}))
      }
    }

    return authorizations
  }
}
