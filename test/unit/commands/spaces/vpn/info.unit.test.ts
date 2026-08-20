import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {VpnConnection} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/vpn/info.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  vpnConnection: {
    info: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    vpnConnection: {
      info: sinon.stub(),
    },
  }
}

describe('spaces:vpn:info', function () {
  let fakePlatform: FakePlatform
  let vpnConnection: VpnConnection

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    vpnConnection = {
      id: '123456789012',
      ike_version: 1,
      name: 'vpn-connection-name',
      public_ip: '35.161.69.30',
      routable_cidrs: ['172.16.0.0/16'],
      space_cidr_block: '10.0.0.0/16',
      status: 'failed',
      status_message: 'supplied CIDR block already in use',
      tunnels: [
        {
          customer_ip: '52.44.146.197',
          ip: '52.44.146.197',
          last_status_change: '2016-10-25T22:09:05Z',
          pre_shared_key: 'apresharedkey1',
          status: 'UP',
          status_message: 'status message',
        },
        {
          customer_ip: '52.44.146.199',
          ip: '52.44.146.197',
          last_status_change: '2016-10-25T22:09:05Z',
          pre_shared_key: 'apresharedkey2',
          status: 'UP',
          status_message: 'status message',
        },
      ],
    }
  })

  afterEach(function () {
    sinon.restore()
  })

  it('gets VPN info', async function () {
    fakePlatform.vpnConnection.info.resolves(vpnConnection)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      'vpn-connection-name',
    ])

    const actual = removeAllWhitespace(stdout)
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
    expect(fakePlatform.vpnConnection.info.calledOnceWithExactly('my-space', vpnConnection.name)).to.equal(true)
  })

  it('gets VPN info in JSON', async function () {
    fakePlatform.vpnConnection.info.resolves(vpnConnection)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      vpnConnection.name,
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(vpnConnection)
  })

  it('gets VPN info with id', async function () {
    fakePlatform.vpnConnection.info.resolves(vpnConnection)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      vpnConnection.id,
    ])

    const actual = removeAllWhitespace(stdout)
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
