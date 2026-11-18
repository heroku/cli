import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ClientsUpdate from '../../../../src/commands/clients/update.js'

type FakePlatform = {
  oauthClient: {update: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthClient: {update: sinon.stub()},
  }
}

describe('clients:update', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  context('with a name flag', function () {
    it('updates the client name', async function () {
      fakePlatform.oauthClient.update.resolves({
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        name: 'newname',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })

      const {stderr} = await runCommand(ClientsUpdate, ['f6e8d969-129f-42d2-854b-c2eca9d5a42e', '--name', 'newname'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(fakePlatform.oauthClient.update.calledOnceWithExactly('f6e8d969-129f-42d2-854b-c2eca9d5a42e', {name: 'newname'})).to.equal(true)
    })
  })

  context('with a url flag', function () {
    it('updates the client url', async function () {
      fakePlatform.oauthClient.update.resolves({
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        name: 'newname',
        redirect_uri: 'https://heroku.com',
        secret: 'clientsecret',
      })

      const {stderr} = await runCommand(ClientsUpdate, ['f6e8d969-129f-42d2-854b-c2eca9d5a42e', '--url', 'https://heroku.com'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(fakePlatform.oauthClient.update.calledOnceWithExactly('f6e8d969-129f-42d2-854b-c2eca9d5a42e', {redirect_uri: 'https://heroku.com'})).to.equal(true)
    })
  })

  context('with no flags', function () {
    it('errors with no changes provided', async function () {
      const {error} = await runCommand(ClientsUpdate, ['f6e8d969-129f-42d2-854b-c2eca9d5a42e'])

      expect(error?.message).to.equal('No changes provided.')
    })
  })
})
