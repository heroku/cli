import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayVPNStatus} from '../../../lib/spaces/format.js'

type VpnConnectionTunnels = Required<Heroku.PrivateSpacesVpn>['tunnels']

const heredoc = tsheredoc.default

export default class Connections extends Command {
  static description = 'list the VPN Connections for a space'
  static example = heredoc`
  ${color.command('heroku spaces:vpn:connections --space my-space')}
    === my-space VPN Connections
     Name   Status Tunnels
     ────── ────── ───────
     office active UP/UP`

  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get VPN connections from', required: true}),
  }

  static topic = 'spaces'

  protected displayVPNConnections(space: string, connections: Required<Heroku.PrivateSpacesVpn>[]) {
    if (connections.length === 0) {
      ux.stdout('No VPN Connections have been created yet')
      return
    }

    hux.styledHeader(`${space} VPN Connections`)

    hux.table(
      connections,
      {
        Name: {
          get: c => c.name || c.id,
        },
        Status: {
          get: c => displayVPNStatus(c.status),
        },
        Tunnels: {
          get: c => this.tunnelFormat(c.tunnels),
        },
      },
    )
  }

  protected render(space: string, connections: Required<Heroku.PrivateSpacesVpn>[], json: boolean) {
    if (json) {
      hux.styledJSON(connections)
    } else {
      this.displayVPNConnections(space, connections)
    }
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Connections)
    const {json, space} = flags
    const {body: connections} = await this.heroku.get<Required<Heroku.PrivateSpacesVpn>[]>(`/spaces/${space}/vpn-connections`)
    this.render(space, connections, json)
  }

  protected tunnelFormat(t: VpnConnectionTunnels) {
    return t.map(tunnel => displayVPNStatus(tunnel.status)).join('/')
  }
}
