import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayCIDR, displayVPNStatus} from '../../../lib/spaces/format.js'

const heredoc = tsheredoc.default

export default class Info extends Command {
  static args = {
    name: Args.string({
      description: 'name or id of the VPN connection to get info from',
      required: true,
    }),
  }

  static description = 'display the information for VPN'
  static example = heredoc`
    ${color.command('heroku spaces:vpn:info vpn-connection-name --space my-space')}
    === vpn-connection-name VPN Tunnel Info
    Name:           vpn-connection-name
    ID:             123456789012
    Public IP:      35.161.69.30
    Routable CIDRs: 172.16.0.0/16
    Status:         failed
    Status Message: supplied CIDR block already in use
    === my-space Tunnel Info
     VPN Tunnel IP Address    Status Last Changed         Details
     ────────── ───────────── ────── ──────────────────── ─────────────
     Tunnel 1   52.44.146.197 UP     2016-10-25T22:09:05Z status message
     Tunnel 2   52.44.146.197 UP     2016-10-25T22:09:05Z status message
  `

  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({
      char: 's',
      description: 'space the vpn connection belongs to',
      required: true,
    }),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Info)
    const {json, space} = flags
    const {name} = args
    const {body: vpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
    const connectionName = vpnConnection.name || name
    this.render(connectionName, vpnConnection, json)
  }

  private displayVPNInfo(name: string, vpnConnection: Heroku.PrivateSpacesVpn) {
    hux.styledHeader(`${name} VPN Info`)
    /* eslint-disable perfectionist/sort-objects */
    hux.styledObject({
      Name: name,
      ID: vpnConnection.id,
      'Public IP': vpnConnection.public_ip,
      'Routable CIDRs': displayCIDR(vpnConnection.routable_cidrs),
      Status: `${displayVPNStatus(vpnConnection.status)}`,
      'Status Message': vpnConnection.status_message,
    }, ['Name', 'ID', 'Public IP', 'Routable CIDRs', 'State', 'Status', 'Status Message'])
    /* eslint-enable perfectionist/sort-objects */
    const vpnConnectionTunnels = vpnConnection.tunnels || []
    vpnConnectionTunnels.forEach((val, i) => {
      val.tunnel_id = 'Tunnel ' + (i + 1)
    })
    hux.styledHeader(`${name} VPN Tunnel Info`)
    /* eslint-disable perfectionist/sort-objects */
    hux.table(vpnConnectionTunnels, {
      tunnel_id: {header: 'VPN Tunnel'},
      ip: {header: 'IP Address'},
      status: {
        header: 'Status',
        get: row => displayVPNStatus(row.status),
      },
      last_status_change: {header: 'Status Last Changed'},
      status_message: {header: 'Details'},
    })
    /* eslint-enable perfectionist/sort-objects */
  }

  private render(name: string, vpnConnection: Heroku.PrivateSpacesVpn, json: boolean) {
    if (json) {
      hux.styledJSON(vpnConnection)
    } else {
      this.displayVPNInfo(name, vpnConnection)
    }
  }
}
