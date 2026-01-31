import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/config.js'
import runCommand from '../../../../helpers/runCommand.js'
import nock from 'nock'
import {expect} from 'chai'
import * as Heroku from '@heroku-cli/schema'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

describe('spaces:vpn:config', function () {
  let vpnConnection: Heroku.PrivateSpacesVpn

  beforeEach(function () {
    vpnConnection = {
      id: '123456789012',
      name: 'vpn-connection-name-config',
      public_ip: '35.161.69.30',
      routable_cidrs: ['172.16.0.0/16'],
      ike_version: 1,
      space_cidr_block: '10.0.0.0/16',
      status: 'failed',
      status_message: 'supplied CIDR block already in use',
      tunnels: [
        {
          last_status_change: '2016-10-25T22:09:05Z',
          ip: '52.44.146.196', // The one needed right now
          customer_ip: '52.44.146.197',
          pre_shared_key: 'apresharedkey1',
          status: 'UP',
          status_message: 'status message',
        },
        {
          last_status_change: '2016-10-25T22:09:05Z',
          ip: '52.44.146.198',
          customer_ip: '52.44.146.199',
          pre_shared_key: 'apresharedkey2',
          status: 'UP',
          status_message: 'status message',
        },
      ],
    }
  })

  it('gets VPN config', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-config')
      .reply(200, vpnConnection)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      'vpn-connection-name-config',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== vpn-connection-name-config VPN Tunnels'))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1'))
  })

  it('gets VPN config in JSON', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name-config')
      .reply(200, vpnConnection)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      'vpn-connection-name-config',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(vpnConnection)
  })
})
