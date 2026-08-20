import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/spaces/vpn/connect.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  vpnConnection: {
    create: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    vpnConnection: {
      create: sinon.stub().resolves(),
    },
  }
}

describe('spaces:vpn:connect', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('creates a VPN', async function () {
    const {stderr} = await runCommand(Cmd, [
      'office',
      '--space',
      'my-space',
      '--ip',
      '192.168.0.1',
      '--cidrs',
      '192.168.0.1/16,192.168.0.2/16',
    ])
    expect(stderr).to.contain('Creating VPN Connection in space ⬡ my-space... done\n')
    expect(ansis.strip(stderr)).to.contain(heredoc`
      Use heroku spaces:vpn:wait to track allocation.
    `)
    expect(fakePlatform.vpnConnection.create.calledOnceWithExactly('my-space', {
      name: 'office',
      public_ip: '192.168.0.1',
      routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16'],
    })).to.equal(true)
  })
})
