import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import confirmCommand from '../../../lib/confirmCommand'

export default class Remove extends Command {
  static topic = 'outbound-rules'
  static description = 'Remove a Rules from the list of Outbound Rules';
  static examples = [heredoc(`
  $ heroku outbound-rules:remove --space my-space 4
      Removed 192.168.2.0/24 from trusted IP ranges on my-space
  `)]

  static hidden = true
  static flags = {
    space: flags.string({optional: false, description: 'space to remove rule from'}),
    confirm: flags.string({description: 'set to space name to bypass confirm prompt'}),
  }

  static args = {
    ruleNumber: Args.string({required: true}),
  }

  private clientOptions = {
    headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Remove)
    const space = flags.space
    if (!space)
      throw new Error('Space name required.')
    const {body: ruleset} = await this.heroku.get<Heroku.OutboundRuleset>(`/spaces/${space}/outbound-ruleset`, this.clientOptions)
    if (!ruleset.rules?.length) {
      throw new Error('No Outbound Rules configured. Nothing to do.')
    }

    const deleted = ruleset.rules.splice(Number.parseInt(args.ruleNumber, 10) - 1, 1)[0]
    await confirmCommand(space, flags.confirm, heredoc(`
    Destructive Action
    This will remove:
    Destination: ${deleted.target}, From Port: ${deleted.from_port}, To Port: ${deleted.to_port}, Protocol ${deleted.protocol}
    from the Outbound Rules on ${color.cyan.bold(space)}
    `))
    const opts = {...this.clientOptions, body: ruleset}
    await this.heroku.put(`/spaces/${space}/outbound-ruleset`, opts)
    ux.log(`Removed Rule ${color.cyan.bold(args.ruleNumber)} from Outbound Rules on ${color.cyan.bold(space)}`)
    ux.warn('It may take a few moments for the changes to take effect.')
  }
}
