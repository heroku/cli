import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {ExtendedInboundRuleset} from '../../../lib/types/spaces.js'

const heredoc = tsheredoc.default

export default class Index extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }
  static description = heredoc(`
  list trusted IP ranges for a space
  Trusted IP ranges are only available on Private Spaces.

  The space name is a required parameter. Newly created spaces will have 0.0.0.0/0 set by default
  allowing all traffic to applications in the space. More than one CIDR block can be provided at
  a time to the commands listed below. For example 1.2.3.4/20 and 5.6.7.8/20 can be added with:
  `)
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get inbound rules from'}),
  }
  static hiddenAliases = ['trusted-ips']
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(Index)
    const space = flags.space || args.space
    if (!space) {
      throw new Error('Space name required.\nUSAGE: heroku trusted-ips my-space')
    }

    const rules = await platform.inboundRuleset.current(space)

    if (flags.json) {
      ux.stdout(JSON.stringify(rules, null, 2))
    } else {
      this.displayRules(space, rules)
    }
  }

  private displayRules(space: string, ruleset: ExtendedInboundRuleset) {
    if (ruleset.rules.length > 0) {
      hux.styledHeader('Trusted IP Ranges')
      for (const rule of ruleset.rules) {
        ux.stdout(rule.source)
      }
    } else {
      hux.styledHeader(`${space} has no trusted IP ranges. All inbound web requests to dynos are blocked.`)
    }

    // Check applied status to inform users whether rules are effectively applied to the space.
    // The applied field is optional for backward compatibility with API versions that don't include it yet.
    // Once the API always includes the applied field (W-19525612), this can be simplified to:
    //   if (ruleset.applied) { ... } else { ... }
    if (ruleset.applied === true) {
      ux.stdout('Trusted IP rules are applied to this space.')
    } else if (ruleset.applied === false) {
      ux.stdout('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
    }
  }
}
