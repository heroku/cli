import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {VpnConnectionFailedError, WaitForActiveOptions} from '@heroku/sdk/extensions/platform'
import {VpnConnection} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/vpn/wait.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  vpnConnection: {
    waitForActive: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    vpnConnection: {
      waitForActive: sinon.stub(),
    },
  }
}

function buildVpnConnection(overrides: Partial<VpnConnection> = {}): VpnConnection {
  return {
    id: '123456789012',
    ike_version: 1,
    name: 'vpn-connection-name-wait',
    public_ip: '35.161.69.30',
    routable_cidrs: ['172.16.0.0/16'],
    space_cidr_block: '10.0.0.0/16',
    status: 'active',
    status_message: '',
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
    ...overrides,
  }
}

describe('spaces:vpn:wait', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('returns an error if the VPN status is updated to failed', async function () {
    const vpnConnection = buildVpnConnection({
      status: 'failed',
      status_message: 'supplied CIDR block already in use',
    })

    fakePlatform.vpnConnection.waitForActive.rejects(new VpnConnectionFailedError(vpnConnection))

    const {error} = await runCommand(Cmd, [
      'vpn-connection-name-wait',
      '--space',
      'my-space',
      '--interval',
      '0',
    ])

    expect(error?.message).to.equal('supplied CIDR block already in use')
  })

  it('waits for VPN to allocate and then shows space config', async function () {
    const vpnConnection = buildVpnConnection({
      status: 'active',
      status_message: '',
    })

    fakePlatform.vpnConnection.waitForActive.callsFake(async (_space: string, _connection: string, opts?: WaitForActiveOptions) => {
      opts?.poller?.onStart?.(vpnConnection)
      opts?.poller?.onStop?.(vpnConnection)
      return vpnConnection
    })

    const {stderr, stdout} = await runCommand(Cmd, [
      'vpn-connection-name-wait',
      '--space',
      'my-space',
      '--interval',
      '0',
    ])
    expect(stderr).to.equal('Waiting for VPN Connection vpn-connection-name-wait to allocate... done\n')

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== vpn-connection-name-wait VPN Tunnels'))
    expect(actual).to.include(removeAllWhitespace('VPN Tunnel Customer Gateway VPN Gateway   Pre-shared Key Routable Subnets IKE Version'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 1   52.44.146.197    52.44.146.196 apresharedkey1 10.0.0.0/16      1'))
    expect(actual).to.include(removeAllWhitespace('Tunnel 2   52.44.146.199    52.44.146.198 apresharedkey2 10.0.0.0/16      1'))
  })
})
