import {PrivateSpacesVpn} from '@heroku-cli/schema'
import {expect} from 'chai'
import {stdout} from 'stdout-stderr'

import {displayVPNConfigInfo} from '../../../../src/lib/spaces/vpn-connections.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const vpnConnection: PrivateSpacesVpn = {
  id: '123456789012',
  ike_version: 1,
  name: 'vpn-connection-name-config',
  public_ip: '35.161.69.30',
  routable_cidrs: ['172.16.0.0/16'],
  space_cidr_block: '10.0.0.0/16',
  status: 'failed',
  status_message: 'supplied CIDR block already in use',
  tunnels: [
    {
      customer_ip: '52.44.146.197',
      ip: '52.44.146.196',
      last_status_change: '2016-10-25T22:09:05Z',
      pre_shared_key: 'apresharedkey1',
      status: 'UP',
      status_message: 'status message',
    },
    {
      customer_ip: '52.44.146.199',
      ip: '52.44.146.198',
      last_status_change: '2016-10-25T22:09:05Z',
      pre_shared_key: 'apresharedkey2',
      status: 'UP',
      status_message: 'status message',
    },
  ],
}

describe('displayVPNConfigInfo', function () {
  it('displays VPN config info', function () {
    stdout.start()
    displayVPNConfigInfo('my-space', 'vpn-connection-name-config', vpnConnection)
    stdout.stop()

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== vpn-connection-name-config VPN Tunnels'))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1'))
  })
})
