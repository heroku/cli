import {Command, flags} from '@heroku-cli/command'
import {ScopeCompletion} from '@heroku-cli/command/lib/completions'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

import {display} from '../../lib/authorizations'

export default class AuthorizationsCreate extends Command {
  static description = 'create a new OAuth authorization'

  static examples = [
    '$ heroku authorizations:create --description "For use with Anvil"'
  ]

  static flags = {
    description: flags.string({char: 'd', description: 'set a custom authorization'}),
    short: flags.boolean({char: 'S', description: 'only output token'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    scope: flags.string({char: 's', description: 'set custom OAuth scopes', completion: ScopeCompletion}),
    'expires-in': flags.string({char: 'e', description: 'set expiration in seconds (default no expiration)'})
  }

  async run() {
    const {flags} = this.parse(AuthorizationsCreate)

    cli.action.start('Creating OAuth Authorization')

    let {body: auth} = await this.heroku.post<Heroku.OAuthAuthorization>('/oauth/authorizations', {
      body: {
        description: flags.description,
        scope: flags.scope ? flags.scope.split(',') : undefined,
        expires_in: flags['expires-in']
      }
    })

    cli.action.stop()

    if (flags.short) {
      cli.log(auth.access_token && auth.access_token.token)
    } else if (flags.json) {
      cli.styledJSON(auth)
    } else {
      display(auth)
    }
  }
}
