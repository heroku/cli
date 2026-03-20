import {Command, flags} from '@heroku-cli/command'
import {ScopeCompletion} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsCreate extends Command {
  static description = 'create a new OAuth authorization'

  static examples = [
    color.command('heroku authorizations:create --description "For use with Anvil"'),
  ]

  static flags = {
    description: flags.string({char: 'd', description: 'set a custom authorization'}),
    'expires-in': flags.string({char: 'e', description: 'set expiration in seconds (default no expiration)'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    scope: flags.string({char: 's', completion: ScopeCompletion, description: 'set custom OAuth scopes'}),
    short: flags.boolean({char: 'S', description: 'only output token'}),
  }

  async run() {
    const {flags} = await this.parse(AuthorizationsCreate)

    ux.action.start('Creating OAuth Authorization')

    const {body: auth} = await this.heroku.post<Heroku.OAuthAuthorization>('/oauth/authorizations', {
      body: {
        description: flags.description,
        expires_in: flags['expires-in'],
        scope: flags.scope ? flags.scope.split(',') : undefined,
      },
    })

    ux.action.stop()

    if (flags.short) {
      ux.stdout(auth.access_token && auth.access_token.token)
    } else if (flags.json) {
      hux.styledJSON(auth)
    } else {
      display(auth)
    }
  }
}
