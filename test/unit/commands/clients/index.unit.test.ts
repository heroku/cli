import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import ClientsIndex from '../../../../src/commands/clients/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  oauthClient: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthClient: {list: sinon.stub()},
  }
}

describe('clients', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('with clients', function () {
    const exampleClient1 = {
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      name: 'awesome',
      redirect_uri: 'https://myapp.com',
    }

    it('lists the clients', async function () {
      fakePlatform.oauthClient.list.resolves([exampleClient1])

      const {stdout} = await runCommand(ClientsIndex, [])

      const actual = removeAllWhitespace(stdout)
      const expected = removeAllWhitespace('awesome f6e8d969-129f-42d2-854b-c2eca9d5a42e https://myapp.com')
      expect(actual).to.include(expected)
    })

    it('lists the clients as json', async function () {
      fakePlatform.oauthClient.list.resolves([exampleClient1])

      const {stdout} = await runCommand(ClientsIndex, ['--json'])

      expect(JSON.parse(stdout)[0]).to.contain(exampleClient1)
    })
  })

  describe('without clients', function () {
    it('shows no clients message', async function () {
      fakePlatform.oauthClient.list.resolves([])

      const {stdout} = await runCommand(ClientsIndex, [])

      expect(stdout).to.equal('No OAuth clients.\n')
    })
  })
})
