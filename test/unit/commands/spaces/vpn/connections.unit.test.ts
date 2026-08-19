import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {VpnConnection} from '@heroku/types/3.sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/vpn/connections.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  vpnConnection: {
    list: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    vpnConnection: {
      list: sinon.stub(),
    },
  }
}

describe('spaces:vpn:connections', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const space: VpnConnection = {
    id: '123456789012',
    ike_version: 1,
    name: 'office',
    public_ip: '35.161.69.30',
    routable_cidrs: [
      '172.16.0.0/16',
    ],
    space_cidr_block: '10.0.0.0/16',
    status: 'active',
    status_message: 'Active',
    tunnels: [
      {
        customer_ip: '52.44.146.197',
        ip: '52.44.146.197',
        last_status_change: '2016-10-25T22:10:05Z',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
      {
        customer_ip: '52.44.146.196',
        ip: '52.44.146.196',
        last_status_change: '2016-10-25T22:09:05Z',
        pre_shared_key: 'secret',
        status: 'UP',
        status_message: 'status message',
      },
    ],
  }

  it('displays no connection message if none exist', async function () {
    fakePlatform.vpnConnection.list.resolves([])

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    expect(stdout).to.eq('No VPN Connections have been created yet\n')
    expect(fakePlatform.vpnConnection.list.calledOnceWithExactly('my-space')).to.equal(true)
  })

  it('displays VPN Connections', async function () {
    fakePlatform.vpnConnection.list.resolves([space])

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== my-space VPN Connections'))
    expect(actual).to.include(removeAllWhitespace('Name   Status Tunnels'))
    expect(actual).to.include(removeAllWhitespace('office active UP/UP'))
  })

  it('displays VPN Connection ID when name is unavailable', async function () {
    const conn = {...space, name: ''}
    fakePlatform.vpnConnection.list.resolves([conn])

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('=== my-space VPN Connections'))
    expect(actual).to.include(removeAllWhitespace('Name   Status Tunnels'))
    expect(actual).to.include(removeAllWhitespace('123456789012 active UP/UP'))
  })

  it('displays VPN Connections in JSON', async function () {
    fakePlatform.vpnConnection.list.resolves([space])

    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])

    expect(JSON.parse(stdout)).to.eql([space])
  })
})
