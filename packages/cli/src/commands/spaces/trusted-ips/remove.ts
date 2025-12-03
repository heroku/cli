import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'

export default class Remove extends Command {
  static topic = 'spaces'
  static hiddenAliases = ['trusted-ips:remove']
  static description = heredoc(`
  Remove a range from the list of trusted IP ranges
  Uses CIDR notation.`)

  static examples = [heredoc(`
  $ heroku trusted-ips:remove --space my-space 192.168.2.0/24
      Removed 192.168.2.0/24 from trusted IP ranges on my-space
        `)]

  static flags = {
    space: flags.string({required: true, char: 's', description: 'space to remove rule from'}),
    confirm: flags.string({description: 'set to space name to bypass confirm prompt'}),
  }

  static args = {
    source: Args.string({required: true, description: 'IP address in CIDR notation'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Remove)
    const space = flags.space
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
    ux.log(`Removed ${color.cyan.bold(args.source)} from trusted IP ranges on ${color.cyan.bold(space)}`)
    
    // Fetch updated ruleset to check applied status
    const {body: updatedRuleset} = await this.heroku.get<Heroku.InboundRuleset>(url)
    if (updatedRuleset.applied === true) {
      ux.log('Trusted IP rules are applied to this space.')
    } else if (updatedRuleset.applied === false) {
      ux.warn('Trusted IP rules are not applied to this space. Update your Trusted IP list to trigger a re-application of the rules.')
    }
  }
}
