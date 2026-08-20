import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/vpn/update.js'

type FakePlatform = {
  vpnConnection: {
    update: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    vpnConnection: {
      update: sinon.stub().resolves(),
    },
  }
}

describe('spaces:vpn:update', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('updates VPN', async function () {
    const {stderr} = await runCommand(Cmd, [
      'office',
      '--space',
      'my-space',
      '--cidrs',
      '192.168.0.1/16,192.168.0.2/16',
    ])
    expect(stderr).to.eq('Updating VPN Connection in space ⬡ my-space... done\n')
    expect(fakePlatform.vpnConnection.update.calledOnceWithExactly('my-space', 'office', {
      routable_cidrs: ['192.168.0.1/16', '192.168.0.2/16'],
    })).to.equal(true)
  })
})
