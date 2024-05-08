import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'

export default class Add extends Command {
  static topic = 'spaces'
  static aliases = ['trusted-ips:add']
  static description = heredoc(`
  Add one range to the list of trusted IP ranges
  Uses CIDR notation.`)

  static examples = [heredoc(`
  $ heroku trusted-ips:add --space my-space 192.168.2.0/24
    Added 192.168.0.1/24 to trusted IP ranges on my-space`)]

  static flags = {
    space: flags.string({char: 's', description: 'space to add rule to', required: true}),
    confirm: flags.string({description: 'set to space name to bypass confirm prompt'}),
  };

  static args = {
    source: Args.string({required: true}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Add)
    const {space} = flags
    const url = `/spaces/${space}/inbound-ruleset`
    const options = {
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    }
    const {body: ruleset} = await this.heroku.get<Heroku.InboundRuleset>(url, options)
    if (!this.isUniqueRule(ruleset, args.source)) {
      throw new Error(`A rule already exists for ${args.source}.`)
    }

    ruleset.rules.push({action: 'allow', source: args.source})
    await this.heroku.put(url, {...options, body: ruleset})
    ux.log(`Added ${color.cyan.bold(args.source)} to trusted IP ranges on ${color.cyan.bold(space)}`)
    ux.warn('It may take a few moments for the changes to take effect.')
  }

  private isUniqueRule(ruleset: Heroku.InboundRuleset, source: string): ruleset is Required<Heroku.InboundRuleset> {
    return Array.isArray(ruleset.rules) && !ruleset.rules.some(rs => rs.source === source)
  }
}
