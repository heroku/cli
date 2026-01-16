import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Add extends Command {
  static args = {
    source: Args.string({description: 'IP address in CIDR notation', required: true}),
  }

  static description = heredoc(`
  Add one range to the list of trusted IP ranges
  Uses CIDR notation.`)

  static examples = [heredoc(`
  $ heroku trusted-ips:add --space my-space 192.168.2.0/24
    Added 192.168.0.1/24 to trusted IP ranges on my-space`)]

  static flags = {
    confirm: flags.string({description: 'set to space name to bypass confirm prompt'}),
    space: flags.string({char: 's', description: 'space to add rule to', required: true}),
  }

  static hiddenAliases = ['trusted-ips:add']

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)
    const {space} = flags
    const url = `/spaces/${space}/inbound-ruleset`
    const {body: ruleset} = await this.heroku.get<Heroku.InboundRuleset>(url)
    if (!this.isUniqueRule(ruleset, args.source)) {
      throw new Error(`A rule already exists for ${args.source}.`)
    }

    ruleset.rules.push({action: 'allow', source: args.source})
    await this.heroku.put(url, {body: ruleset})
    ux.stdout(`Added ${color.cyan.bold(args.source)} to trusted IP ranges on ${color.space(space)}`)

    // Fetch updated ruleset to check applied status
    const {body: updatedRuleset} = await this.heroku.get<Heroku.InboundRuleset>(url)
    // Check applied status to inform users whether rules are effectively applied to the space.
    // The applied field is optional for backward compatibility with API versions that don't include it yet.
    // Once the API always includes the applied field (W-19525612), this can be simplified to:
    //   if (updatedRuleset.applied) { ... } else { ... }
    if (updatedRuleset.applied === true) {
      ux.stdout('Trusted IP rules are applied to this space.')
    } else if (updatedRuleset.applied === false) {
      ux.stdout('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
    }
  }

  private isUniqueRule(ruleset: Heroku.InboundRuleset, source: string): ruleset is Required<Heroku.InboundRuleset> {
    return Array.isArray(ruleset.rules) && !ruleset.rules.some(rs => rs.source === source)
  }
}
