import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {VpnConnection} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import {displayVPNStatus} from '../../../lib/spaces/format.js'

type VpnConnectionTunnels = VpnConnection['tunnels']

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

  protected displayVPNConnections(space: string, connections: VpnConnection[]) {
    if (connections.length === 0) {
      ux.stdout('No VPN Connections have been created yet')
      return
    }

    hux.styledHeader(`${space} VPN Connections`)

    hux.table(
      connections,
      {
        Name: {
          get: (c: any) => c.name || c.id,
        },
        Status: {
          get: (c: any) => displayVPNStatus(c.status),
        },
        Tunnels: {
          get: (c: any) => this.tunnelFormat(c.tunnels),
        },
      },
    )
  }

  protected render(space: string, connections: VpnConnection[], json: boolean) {
    if (json) {
      hux.styledJSON(connections)
    } else {
      this.displayVPNConnections(space, connections)
    }
  }

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK()
    const {flags} = await this.parse(Connections)
    const {json, space} = flags
    const connections = await platform.vpnConnection.list(space)
    this.render(space, connections, json)
  }

  protected tunnelFormat(t: VpnConnectionTunnels) {
    return t.map(tunnel => displayVPNStatus(tunnel.status)).join('/')
  }
}
