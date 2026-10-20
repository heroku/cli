import {Command, flags} from '@heroku-cli/command'
import {ScopeCompletion} from '@heroku-cli/command/lib/completions.js'
import {hux} from '@heroku/heroku-cli-util'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {display} from '../../lib/authorizations/authorizations.js'
import {createSDK} from '../../lib/sdk.js'

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
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(AuthorizationsCreate)

    ux.action.start('Creating OAuth Authorization')

    const auth = await platform.oauthAuthorization.create({
      description: flags.description,
      expires_in: flags['expires-in'] ? Number.parseInt(flags['expires-in'], 10) : undefined,
      // scope is optional server-side (omitted ⇒ global); @heroku/types types it as required, so cast the absent case
      scope: (flags.scope ? flags.scope.split(',') : undefined) as string[],
    })

    ux.action.stop()

    if (flags.short) {
      ux.stdout(auth.access_token?.token)
    } else if (flags.json) {
      hux.styledJSON(auth)
    } else {
      display(auth)
    }
  }
}
