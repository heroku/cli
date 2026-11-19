import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ClientsInfo from '../../../../src/commands/clients/info.js'

type FakePlatform = {
  oauthClient: {info: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthClient: {info: sinon.stub()},
  }
}

describe('clients:info', function () {
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

  it('gets the client info', async function () {
    fakePlatform.oauthClient.info.resolves(client)

    const {stdout} = await runCommand(ClientsInfo, [id])

    expect(stdout).to.contain('=== awesome\n')
    expect(stdout).to.contain('id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
    expect(stdout).to.contain('name:         awesome\n')
    expect(stdout).to.contain('redirect_uri: https://myapp.com\n')
    expect(stdout).to.contain('secret:       supersecretkey\n')
    expect(fakePlatform.oauthClient.info.calledOnceWithExactly(id)).to.equal(true)
  })

  context('with json flag', function () {
    it('gets the client info as json', async function () {
      fakePlatform.oauthClient.info.resolves(client)

      const {stdout} = await runCommand(ClientsInfo, [id, '--json'])

      expect(JSON.parse(stdout)).to.contain(client)
    })
  })

  context('with shell flag', function () {
    it('gets the client info as shell', async function () {
      fakePlatform.oauthClient.info.resolves(client)

      const {stdout} = await runCommand(ClientsInfo, [id, '--shell'])

      expect(stdout).to.equal('HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=supersecretkey\n')
    })
  })
})
