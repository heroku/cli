import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import SessionsDestroy from '../../../../src/commands/sessions/destroy.js'

type FakePlatform = {
  oauthSession: {delete: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthSession: {delete: sinon.stub()},
  }
}

describe('sessions:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('destroys the session', async function () {
    fakePlatform.oauthSession.delete.resolves({})

    const {stderr} = await runCommand(SessionsDestroy, ['f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

    expect(stderr).to.contain('Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done')
    expect(fakePlatform.oauthSession.delete.calledOnceWithExactly('f6e8d969-129f-42d2-854b-c2eca9d5a42e')).to.equal(true)
  })
})
