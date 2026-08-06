import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Authorizations from '../../../../src/commands/authorizations/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  oauthAuthorization: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    oauthAuthorization: {list: sinon.stub()},
  }
}

describe('authorizations', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  const exampleAuthorization1 = {
    description: 'b description',
    id: 'aBcD1234-129f-42d2-854b-dEf123abc123',
    scope: ['global'],
  }
  const exampleAuthorization2 = {
    description: 'awesome',
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
    scope: ['app', 'user'],
  }

  it('lists the authorizations alphabetically by description', async function () {
    fakePlatform.oauthAuthorization.list.resolves([exampleAuthorization1, exampleAuthorization2])

    const {stdout} = await runCommand(Authorizations, [])

    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace(`
      awesome       f6e8d969-129f-42d2-854b-c2eca9d5a42e app,user
      b description aBcD1234-129f-42d2-854b-dEf123abc123 global`)
    expect(actual).to.include(expected)
  })

  context('with json flag', function () {
    it('lists the authorizations alphabetically as json', async function () {
      fakePlatform.oauthAuthorization.list.resolves([exampleAuthorization1, exampleAuthorization2])

      const {stdout} = await runCommand(Authorizations, ['--json'])

      const authJSON = JSON.parse(stdout)
      expect(authJSON[0]).to.eql(exampleAuthorization2)
      expect(authJSON[1]).to.eql(exampleAuthorization1)
    })
  })

  context('without authorizations', function () {
    it('shows no authorizations message', async function () {
      fakePlatform.oauthAuthorization.list.resolves([])

      const {stdout} = await runCommand(Authorizations, [])

      expect(stdout).to.equal('No OAuth authorizations.\n')
    })
  })
})
