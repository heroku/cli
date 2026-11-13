import type {OauthAuthorization} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import {ScopeCompletion} from '@heroku-cli/command/lib/completions.js'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {format} from '../../lib/authorizations/authorizations.js'
import {createSDK} from '../../lib/sdk.js'

export default class AuthorizationsCreate extends Command {
  static description = 'create a new OAuth authorization'
  static enableJsonFlag = true
  static examples = [
    color.command('heroku authorizations:create --description "For use with Anvil"'),
    color.command('heroku authorizations:create --json | jq -r .access_token.token'),
  ]
  static flags = {
    description: flags.string({char: 'd', description: 'set a custom authorization'}),
    'expires-in': flags.integer({char: 'e', description: 'set expiration in seconds (default no expiration)'}),
    scope: flags.string({char: 's', completion: ScopeCompletion, description: 'set custom OAuth scopes'}),
    short: flags.boolean({char: 'S', description: 'only output token (overrides HEROKU_CONTENT_TYPE=json)', exclusive: ['json']}),
    team: flags.team({description: 'team to create OAuth authorization on'}),
  }
  // oclif decides JSON mode by calling jsonEnabled() with no arguments, including after
  // run() returns (to print the result) and in catch(). Parsed flags aren't visible there,
  // so run() records --short here. --short with --json is rejected by `exclusive`; this
  // only makes --short win over HEROKU_CONTENT_TYPE=json, so a script gets the bare token.
  private short = false

  public jsonEnabled(): boolean {
    return !this.short && super.jsonEnabled()
  }

  async run(): Promise<OauthAuthorization> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(AuthorizationsCreate)
    this.short = flags.short

    ux.action.start('Creating OAuth Authorization')

    const scope = flags.scope ? flags.scope.split(',') : undefined
    const auth = flags.team
      ? await platform.oauthAuthorization.teamCreate(flags.team, {
        description: flags.description,
        expires_in: flags['expires-in'],
        scope,
      })
      : await platform.oauthAuthorization.create({
        description: flags.description,
        expires_in: flags['expires-in'],
        // scope is optional server-side (omitted ⇒ global); @heroku/types types it as required, so cast the absent case
        scope: scope as string[],
      })

    ux.action.stop()

    if (flags.short) {
      this.log(auth.access_token?.token)
    } else {
      this.log(format(auth))
    }

    return auth
  }
}
