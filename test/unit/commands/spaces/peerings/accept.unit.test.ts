import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Accept from '../../../../../src/commands/spaces/peerings/accept.js'

type FakePlatform = {
  peering: {accept: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    peering: {accept: sinon.stub()},
  }
}

describe('spaces:peerings:accept', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('accepts a pending peering connection', async function () {
    fakePlatform.peering.accept.resolves({pcx_id: 'pcx-12345'})

    const {stdout} = await runCommand(Accept, ['--pcxid', 'pcx-12345', '--space', 'my-space'])

    expect(stdout).to.equal('Accepting and configuring peering connection pcx-12345\n')
    expect(fakePlatform.peering.accept.calledOnceWithExactly('my-space', {pcx_id: 'pcx-12345'})).to.equal(true)
  })
})
