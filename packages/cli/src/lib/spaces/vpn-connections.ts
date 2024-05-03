import {PrivateSpacesVpn} from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export function displayVPNConfigInfo(space: string, name: string, config: PrivateSpacesVpn) {
  ux.styledHeader(`${name} VPN Tunnels`)
  const configTunnels = config.tunnels || []
  configTunnels.forEach((val, i) => {
    val.tunnel_id = 'Tunnel ' + (i + 1)
    val.routable_cidr = config.space_cidr_block
    val.ike_version = config.ike_version
  })
  ux.table(configTunnels, {
    tunnel_id: {header: 'VPN Tunnel'},
    customer_ip: {header: 'Customer Gateway'},
    ip: {header: 'VPN Gateway'},
    pre_shared_key: {header: 'Pre-shared Key'},
    routable_cidr: {header: 'Routable Subnets'},
    ike_version: {header: 'IKE Version'},
  })
}
