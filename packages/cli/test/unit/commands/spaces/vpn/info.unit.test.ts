import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/info'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as Heroku from '@heroku-cli/schema'

describe('spaces:vpn:info', function () {
  let vpnConnection: Heroku.PrivateSpacesVpn

  beforeEach(function () {
    vpnConnection = {
      id: '123456789012',
      name: 'vpn-connection-name',
      public_ip: '35.161.69.30',
      routable_cidrs: ['172.16.0.0/16'],
      ike_version: 1,
      space_cidr_block: '10.0.0.0/16',
      status: 'failed',
      status_message: 'supplied CIDR block already in use',
      tunnels: [
        {
          last_status_change: '2016-10-25T22:09:05Z',
          ip: '52.44.146.197',
          customer_ip: '52.44.146.197',
          pre_shared_key: 'apresharedkey1',
          status: 'UP',
          status_message: 'status message',
        },
        {
          last_status_change: '2016-10-25T22:09:05Z',
          ip: '52.44.146.197',
          customer_ip: '52.44.146.199',
          pre_shared_key: 'apresharedkey2',
          status: 'UP',
          status_message: 'status message',
        },
      ],
    }
  })

  it('gets VPN info', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/my-space/vpn-connections/${vpnConnection.name}`)
      .reply(200, vpnConnection)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      'vpn-connection-name',
    ])
    expectOutput(stdout.output, heredoc(`
      === ${vpnConnection.name} VPN Info
      Name:           ${vpnConnection.name}
      ID:             ${vpnConnection.id}
      Public IP:      ${vpnConnection.public_ip}
      Routable CIDRs: 172.16.0.0/16
      Status:         ${vpnConnection.status}
      Status Message: ${vpnConnection.status_message}
      === ${vpnConnection.name} VPN Tunnel Info
       VPN Tunnel IP Address    Status Status Last Changed  Details
       ────────── ───────────── ────── ──────────────────── ──────────────
       Tunnel 1   52.44.146.197 UP     2016-10-25T22:09:05Z status message
       Tunnel 2   52.44.146.197 UP     2016-10-25T22:09:05Z status message
    `))
  })

  it('gets VPN info in JSON', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/vpn-connections/vpn-connection-name')
      .reply(200, vpnConnection)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      vpnConnection.name as string,
      '--json',
    ])
    expectOutput(stdout.output, JSON.stringify(vpnConnection, null, 2))
  })

  it('gets VPN info with id', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/my-space/vpn-connections/${vpnConnection.id}`)
      .reply(200, vpnConnection)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      vpnConnection.id as string,
    ])
    expectOutput(stdout.output, heredoc(`
    === ${vpnConnection.name} VPN Info
    Name:           ${vpnConnection.name}
    ID:             ${vpnConnection.id}
    Public IP:      ${vpnConnection.public_ip}
    Routable CIDRs: 172.16.0.0/16
    Status:         ${vpnConnection.status}
    Status Message: ${vpnConnection.status_message}
    === ${vpnConnection.name} VPN Tunnel Info
     VPN Tunnel IP Address    Status Status Last Changed  Details
     ────────── ───────────── ────── ──────────────────── ──────────────
     Tunnel 1   52.44.146.197 UP     2016-10-25T22:09:05Z status message
     Tunnel 2   52.44.146.197 UP     2016-10-25T22:09:05Z status message
  `))
  })
})
