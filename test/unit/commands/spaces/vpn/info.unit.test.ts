import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/vpn/info.js'
import runCommand from '../../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput.js'
import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

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

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace(`=== ${vpnConnection.name} VPN Info`))
    expect(actual).to.include(removeAllWhitespace(`Name:           ${vpnConnection.name}`))
    expect(actual).to.include(removeAllWhitespace(`ID:             ${vpnConnection.id}`))
    expect(actual).to.include(removeAllWhitespace(`Public IP:      ${vpnConnection.public_ip}`))
    expect(actual).to.include(removeAllWhitespace('Routable CIDRs: 172.16.0.0/16'))
    expect(actual).to.include(removeAllWhitespace(`Status:         ${vpnConnection.status}`))
    expect(actual).to.include(removeAllWhitespace(`Status Message: ${vpnConnection.status_message}`))
    expect(actual).to.include(removeAllWhitespace(`=== ${vpnConnection.name} VPN Tunnel Info`))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel IP Address    Status Status Last Changed  Details'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197 UP     2016-10-25T22:09:05Z status message'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.197 UP     2016-10-25T22:09:05Z status message'))
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

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace(`=== ${vpnConnection.name} VPN Info`))
    expect(actual).to.include(removeAllWhitespace(`Name:           ${vpnConnection.name}`))
    expect(actual).to.include(removeAllWhitespace(`ID:             ${vpnConnection.id}`))
    expect(actual).to.include(removeAllWhitespace(`Public IP:      ${vpnConnection.public_ip}`))
    expect(actual).to.include(removeAllWhitespace('Routable CIDRs: 172.16.0.0/16'))
    expect(actual).to.include(removeAllWhitespace(`Status:         ${vpnConnection.status}`))
    expect(actual).to.include(removeAllWhitespace(`Status Message: ${vpnConnection.status_message}`))
    expect(actual).to.include(removeAllWhitespace(`=== ${vpnConnection.name} VPN Tunnel Info`))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel IP Address    Status Status Last Changed  Details'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197 UP     2016-10-25T22:09:05Z status message'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.197 UP     2016-10-25T22:09:05Z status message'))
  })
})
