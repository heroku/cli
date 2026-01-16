import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Remove extends Command {
  static args = {
    source: Args.string({description: 'IP address in CIDR notation', required: true}),
  }

  static description = heredoc(`
  Remove a range from the list of trusted IP ranges
  Uses CIDR notation.`)

  static examples = [heredoc(`
  $ heroku trusted-ips:remove --space my-space 192.168.2.0/24
      Removed 192.168.2.0/24 from trusted IP ranges on my-space
        `)]

  static flags = {
    confirm: flags.string({description: 'set to space name to bypass confirm prompt'}),
    space: flags.string({char: 's', description: 'space to remove rule from', required: true}),
  }

  static hiddenAliases = ['trusted-ips:remove']

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Remove)
    const {space} = flags
    const url = `/spaces/${space}/inbound-ruleset`
    const {body: rules} = await this.heroku.get<Heroku.InboundRuleset>(url)
    if (rules.rules?.length === 0) {
      throw new Error('No IP ranges are configured. Nothing to do.')
    }

    const originalLength = rules.rules?.length
    rules.rules = rules.rules?.filter(r => r.source !== args.source)
    if (rules.rules?.length === originalLength) {
      throw new Error(`No IP range matching ${args.source} was found.`)
    }

    await this.heroku.put(url, {body: rules})
    ux.stdout(`Removed ${color.cyan.bold(args.source)} from trusted IP ranges on ${color.space(space)}`)

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
}
