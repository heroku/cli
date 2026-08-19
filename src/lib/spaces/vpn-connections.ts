import {hux} from '@heroku/heroku-cli-util'
import {VpnConnection} from '@heroku/types/3.sdk'

export function displayVPNConfigInfo(name: string, config: VpnConnection) {
  hux.styledHeader(`${name} VPN Tunnels`)
  const configTunnels = (config.tunnels || []).map((tunnel, index) => ({
    ...tunnel,
    ike_version: config.ike_version,
    routable_cidr: config.space_cidr_block,
    tunnel_id: `Tunnel ${index + 1}`,
  }))

  /* eslint-disable perfectionist/sort-objects */
  hux.table(configTunnels, {
    tunnel_id: {header: 'VPN Tunnel'},
    customer_ip: {header: 'Customer Gateway'},
    ip: {header: 'VPN Gateway'},
    pre_shared_key: {header: 'Pre-shared Key'},
    routable_cidr: {header: 'Routable Subnets'},
    ike_version: {header: 'IKE Version'},
  })
  /* eslint-enable perfectionist/sort-objects */
}
