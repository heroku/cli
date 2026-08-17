import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/spaces/peerings/destroy.js'

type FakePlatform = {
  peering: {destroy: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    peering: {destroy: sinon.stub()},
  }
}

describe('spaces:peering:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('destroys an active peering connection', async function () {
    fakePlatform.peering.destroy.resolves()

    const {stderr} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--pcxid',
      'pcx-12345',
      '--confirm',
      'pcx-12345',
    ])
    expectOutput(stderr, 'Tearing down peering connection pcx-12345... done\n')
    expect(fakePlatform.peering.destroy.calledOnceWithExactly('my-space', 'pcx-12345')).to.equal(true)
  })

  it('errors when pcxid is missing', async function () {
    const {error} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(error).to.exist
    if (error) {
      expect(error.message).to.include('pcxid required')
    }
  })
})
