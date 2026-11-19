import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ClientsRotate from '../../../../src/commands/clients/rotate.js'

type FakePlatform = {
  oauthClient: {rotateCredentials: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthClient: {rotateCredentials: sinon.stub()},
  }
}

describe('clients:rotate', function () {
  let fakePlatform: FakePlatform

  const id = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const client = {
    id,
    name: 'awesome',
    redirect_uri: 'https://myapp.com',
    secret: 'supersecretkey',
  }

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('returns the client info', async function () {
    fakePlatform.oauthClient.rotateCredentials.resolves(client)

    const {stderr, stdout} = await runCommand(ClientsRotate, [id])

    expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
    expect(stdout).to.contain('=== awesome\n')
    expect(stdout).to.contain('id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
    expect(stdout).to.contain('name:         awesome\n')
    expect(stdout).to.contain('redirect_uri: https://myapp.com\n')
    expect(stdout).to.contain('secret:       supersecretkey\n')
    expect(fakePlatform.oauthClient.rotateCredentials.calledOnceWithExactly(id)).to.equal(true)
  })

  context('with json flag', function () {
    it('returns the client info as json', async function () {
      fakePlatform.oauthClient.rotateCredentials.resolves(client)

      const {stderr, stdout} = await runCommand(ClientsRotate, [id, '--json'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(JSON.parse(stdout)).to.contain(client)
    })
  })

  context('with shell flag', function () {
    it('returns the client info as shell', async function () {
      fakePlatform.oauthClient.rotateCredentials.resolves(client)

      const {stderr, stdout} = await runCommand(ClientsRotate, [id, '--shell'])

      expect(stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(stdout).to.equal('HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=supersecretkey\n')
    })
  })
})
