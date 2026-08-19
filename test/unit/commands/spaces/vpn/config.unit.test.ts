import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {VpnConnection} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/vpn/config.js'
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

describe('spaces:vpn:config', function () {
  let fakePlatform: FakePlatform
  let vpnConnection: VpnConnection

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    vpnConnection = {
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
          ip: '52.44.146.196', // The one needed right now
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
  })

  afterEach(function () {
    sinon.restore()
  })

  it('gets VPN config', async function () {
    fakePlatform.vpnConnection.info.resolves(vpnConnection)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      'vpn-connection-name-config',
    ])

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== vpn-connection-name-config VPN Tunnels'))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1'))
    expect(fakePlatform.vpnConnection.info.calledOnceWithExactly('my-space', 'vpn-connection-name-config')).to.equal(true)
  })

  it('gets VPN config in JSON', async function () {
    fakePlatform.vpnConnection.info.resolves(vpnConnection)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      'vpn-connection-name-config',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(vpnConnection)
  })
})
