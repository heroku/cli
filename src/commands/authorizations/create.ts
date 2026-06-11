import {Command, flags} from '@heroku-cli/command'
import {ScopeCompletion} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {display} from '../../lib/authorizations/authorizations.js'

export default class AuthorizationsCreate extends Command {
  static description = 'create a new OAuth authorization'
  static examples = [
    color.command('heroku authorizations:create --description "For use with Anvil"'),
    color.command('heroku authorizations:create --grant "apps:01ab….read-protected"'),
    color.command('heroku authorizations:create --grant "teams:01ab….apps:*.read+write"'),
    color.command('heroku authorizations:create --grant "apps:01ab….config-vars.read"'),
  ]
  static flags = {
    description: flags.string({char: 'd', description: 'set a custom authorization'}),
    'expires-in': flags.string({char: 'e', description: 'set expiration in seconds (default no expiration)'}),
    grant: flags.string({description: 'grant granular, entity-scoped access, e.g. \'apps:<uuid>.read\' (repeatable); the API validates and rejects malformed grants', multiple: true}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    scope: flags.string({char: 's', completion: ScopeCompletion, description: 'set custom OAuth scopes'}),
    short: flags.boolean({char: 'S', description: 'only output token'}),
  }

  async run() {
    const {flags} = await this.parse(AuthorizationsCreate)

    ux.action.start('Creating OAuth Authorization')

    const legacy = flags.scope ? flags.scope.split(',') : []
    const granular = flags.grant ?? []
    const scope = [...legacy, ...granular]

    const {body: auth} = await this.heroku.post<Heroku.OAuthAuthorization>('/oauth/authorizations', {
      body: {
        description: flags.description,
        expires_in: flags['expires-in'],
        scope: scope.length > 0 ? scope : undefined,
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
