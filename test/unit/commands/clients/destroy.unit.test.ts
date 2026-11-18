import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ClientsDestroy from '../../../../src/commands/clients/destroy.js'

type FakePlatform = {
  oauthClient: {delete: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthClient: {delete: sinon.stub()},
  }
}

describe('clients:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('destroys the client', async function () {
    fakePlatform.oauthClient.delete.resolves({
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      name: 'awesome',
      redirect_uri: 'https://myapp.com',
      secret: 'clientsecret',
    })

    const {stderr} = await runCommand(ClientsDestroy, ['f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

    expect(stderr).to.contain('Destroying f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
    expect(fakePlatform.oauthClient.delete.calledOnceWithExactly('f6e8d969-129f-42d2-854b-c2eca9d5a42e')).to.equal(true)
  })
})
