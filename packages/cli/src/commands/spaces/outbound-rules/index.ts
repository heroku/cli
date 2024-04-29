import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {displayRules, displayRulesAsJSON} from '../../../lib/spaces/outbound-rules'
import * as Heroku from '@heroku-cli/schema'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions'

export default class Index extends Command {
  static description = heredoc(`
    list Outbound Rules for a space
    Outbound Rules are only available on Private Spaces.

    Newly created spaces will have an "Allow All" rule set by default
    allowing all egress dyno traffic outside of the space.  You can
    remove this default rule to completely stop your private dynos from
    talking to the world.

    You can add specific rules that only allow your dyno to communicate with trusted hosts.
  `)

  static aliases = ['outbound-rules']
  static hidden = true
  static flags = {
    space: flags.string({char: 's', description: 'space to get outbound rules from', completion: SpaceCompletion}),
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {body: ruleset} = await this.heroku.get<Heroku.OutboundRuleset>(
      `/spaces/${spaceName}/outbound-ruleset`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
      },
    )
    if (flags.json)
      displayRulesAsJSON(ruleset)
    else
      displayRules(spaceName as string, ruleset)
  }
}
