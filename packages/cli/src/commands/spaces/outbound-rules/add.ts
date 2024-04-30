import {Command, flags} from '@heroku-cli/command'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {parsePorts} from '../../../lib/spaces/outbound-rules'
import * as Heroku from '@heroku-cli/schema'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions'
import {ProtocolCompletion} from '../../../lib/autocomplete/completions'

export default class Add extends Command {
  static topic = 'outbound-rules'
  static description = heredoc(`
    Add outbound rules to a Private Space

    The destination flag uses CIDR notation.
  `)

  static examples = [
    heredoc(`
      $ heroku outbound-rules:add --space my-space --dest 192.168.2.0/24 --protocol tcp --port 80
      Adding rule to the Outbound Rules of my-space... done
    `),
    heredoc(`
      # with port range:
      $ heroku outbound-rules:add --space my-space --dest 192.168.2.0/24 --protocol tcp --port 80-100
      Adding rule to the Outbound Rules of my-space... done
    `),
    heredoc(`
      # opening up everything
      $ heroku outbound-rules:add --space my-space --dest 0.0.0.0/0 --protocol any --port any
      Adding rule to the Outbound Rules of my-space... done
    `),
  ]

  static hidden = true
  static aliases = ['outbound-rules:add']
  static flags = {
    space: flags.string({
      char: 's',
      description: 'space to add rule to',
      required: true,
      completion: SpaceCompletion,
    }),
    dest: flags.string({
      description: 'target CIDR block dynos are allowed to communicate with',
      required: true,
    }),
    protocol: flags.string({
      description: 'the protocol dynos are allowed to use when communicating with hosts in destination CIDR block.',
      completion: ProtocolCompletion,
      options: ['tcp', 'udp', 'icmp', '0-255', 'any'],
      required: true,
    }),
    port: flags.string({
      description: 'the port dynos are allowed to use when communicating with hosts in destination CIDR block. Accepts a range in `<lowest port>-<highest port>` format. 0 is the minimum. The maximum port allowed is 65535, except for ICMP with a maximum of 255.',
    }),
  }

  public async runF(): Promise<void> {
    const {flags} = await this.parse(Add)
    const {space, dest, protocol, port} = flags

    const {body: ruleset} = await this.heroku.get<Heroku.OutboundRuleset>(
      `/spaces/${space}/outbound-ruleset`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
      },
    )

    ruleset.rules = ruleset.rules || []
    const ports = parsePorts(protocol, port)
    ruleset.rules.push({
      target: dest, from_port: ports[0], to_port: ports[1] || ports[0], protocol: protocol,
    })
    ux.action.start(`Adding rule to the Outbound Rules of ${color.cyan.bold(space)}`)
    await this.heroku.put<Heroku.OutboundRuleset>(
      `/spaces/${space}/outbound-ruleset`, {
        headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
        body: ruleset,
      },
    )
    ux.action.stop()
    ux.warn('Modifying the Outbound Rules may break Add-ons for Apps in this Private Space')
  }
}
