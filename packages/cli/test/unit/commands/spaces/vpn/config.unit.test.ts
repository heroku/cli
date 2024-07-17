import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/config'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as Heroku from '@heroku-cli/schema'

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
    expectOutput(stdout.output, heredoc(`
      === vpn-connection-name-config VPN Tunnels
       VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version
       ────────── ──────────────── ───────────── ────────────── ──────────────── ───────────
       Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1
       Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1
    `))
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
