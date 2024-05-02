import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {displayVPNConfigInfo} from '../../../lib/spaces/vpn-connections'
import heredoc from 'tsheredoc'

export default class Config extends Command {
  static topic = 'spaces'
  static description = heredoc(`
    display the configuration information for VPN connections in a Private Space

    You will use the information provided by this command to establish a Private Space VPN Connection.

    - You must configure your VPN Gateway to use both Tunnels provided by Heroku
    - The VPN Gateway values are the IP addresses of the Private Space Tunnels
    - The Customer Gateway value is the Public IP of your VPN Gateway
    - The VPN Gateway must use the IKE Version shown and the Pre-shared Keys as the authentication method
  `)

  static example = heredoc(`
    $ heroku spaces:vpn:config --space my-space vpn-connection-name
    === vpn-connection-name VPN Tunnels
     VPN Tunnel Customer Gateway VPN Gateway    Pre-shared Key Routable Subnets IKE Version
     ────────── ──────────────── ────────────── ────────────── ──────────────── ───────────
     Tunnel 1    104.196.121.200   35.171.237.136  abcdef12345     10.0.0.0/16       1
     Tunnel 2    104.196.121.200   52.44.7.216     fedcba54321     10.0.0.0/16       1
    `)

  static flags = {
    space: flags.string({
      required: true,
      char: 's',
      description: 'space the VPN connection belongs to',
    }),
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    name: Args.string({
      required: true,
      description: 'name or id of the VPN connection to retrieve config from',
    }),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Config)
    const {space, json} = flags
    const {name} = args

    const {body: vpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
    if (json) {
      ux.styledJSON(vpnConnection)
    } else {
      displayVPNConfigInfo(space, name, vpnConnection)
    }
  }
}
