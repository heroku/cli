import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/vpn/destroy.js'

type FakePlatform = {
  vpnConnection: {
    destroy: sinon.SinonStub,
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    vpnConnection: {
      destroy: sinon.stub().resolves(),
    },
  }
}

describe('spaces:vpn:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('destroys a VPN Connection when name is specified', async function () {
    const {stderr} = await runCommand(Cmd, [
      'my-vpn-connection',
      '--space',
      'my-space',
      '--confirm',
      'my-vpn-connection',
    ])
    expect(stderr).to.eq('Tearing down VPN Connection my-vpn-connection in space ⬡ my-space... done\n')
    expect(fakePlatform.vpnConnection.destroy.calledOnceWithExactly('my-space', 'my-vpn-connection')).to.equal(true)
  })
})
