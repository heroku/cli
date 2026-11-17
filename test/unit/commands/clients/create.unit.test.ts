import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ClientsCreate from '../../../../src/commands/clients/create.js'

type FakePlatform = {
  oauthClient: {create: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthClient: {create: sinon.stub()},
  }
}

describe('clients:create', function () {
  let fakePlatform: FakePlatform

  const createResponse = {
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
    name: 'awesome',
    redirect_uri: 'https://myapp.com',
    secret: 'clientsecret',
  }

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('creates the client and outputs id and secret', async function () {
    fakePlatform.oauthClient.create.resolves(createResponse)

    const {stderr, stdout} = await runCommand(ClientsCreate, ['awesome', 'https://myapp.com'])

    expect(stdout).to.equal('HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=clientsecret\n')
    expect(stderr).to.contain('Creating awesome... done\n')
    expect(fakePlatform.oauthClient.create.calledOnceWithExactly({
      name: 'awesome',
      redirect_uri: 'https://myapp.com',
    })).to.equal(true)
  })

  it('creates the client and outputs json', async function () {
    fakePlatform.oauthClient.create.resolves(createResponse)

    const {stderr, stdout} = await runCommand(ClientsCreate, ['awesome', 'https://myapp.com', '--json'])

    expect(JSON.parse(stdout)).to.contain(createResponse)
    expect(stderr).to.contain('Creating awesome... done\n')
  })
})
