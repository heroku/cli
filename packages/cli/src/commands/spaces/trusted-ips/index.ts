import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'

export default class Index extends Command {
  static aliases = ['trusted-ips']
  static topic = 'trusted-ips'
  static description = heredoc(`
  list trusted IP ranges for a space
  Trusted IP ranges are only available on Private Spaces.

  The space name is a required parameter. Newly created spaces will have 0.0.0.0/0 set by default
  allowing all traffic to applications in the space. More than one CIDR block can be provided at
  a time to the commands listed below. For example 1.2.3.4/20 and 5.6.7.8/20 can be added with:
  `)

  static flags = {
    space: flags.string({char: 's', description: 'space to get inbound rules from'}),
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Index)
    const space = flags.space || args.space
    if (!space) {
      throw new Error('Space name required.\nUSAGE: heroku trusted-ips my-space')
    }

    const {body: rules} = await this.heroku.get<Required<Heroku.InboundRuleset>>(`/spaces/${space}/inbound-ruleset`,
      {
        headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
      })

    if (flags.json) {
      ux.log(JSON.stringify(rules, null, 2))
    } else {
      this.displayRules(space, rules)
    }
  }

  private displayRules(space: string, ruleset: Required<Heroku.InboundRuleset>) {
    if (ruleset.rules.length > 0) {
      ux.styledHeader('Trusted IP Ranges')
      for (const rule of ruleset.rules) {
        ux.log(rule.source)
      }
    } else {
      ux.styledHeader(`${space} has no trusted IP ranges. All inbound web requests to dynos are blocked.`)
    }
  }
}
