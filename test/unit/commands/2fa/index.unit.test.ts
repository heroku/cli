import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import TwoFactorAuth from '../../../../src/commands/auth/2fa/index.js'

type FakePlatform = {
  account: {getWithDelinquency: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {getWithDelinquency: stub()},
  }
}

describe('2fa', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('shows 2fa is enabled', async function () {
    fakePlatform.account.getWithDelinquency.resolves({account: {two_factor_authentication: true}, delinquency: null})

    const {stdout} = await runCommand(TwoFactorAuth, [])

    expect(stdout).to.equal('Two-factor authentication is enabled\n')
  })

  it('shows 2fa is not enabled', async function () {
    fakePlatform.account.getWithDelinquency.resolves({account: {two_factor_authentication: false}, delinquency: null})

    const {stdout} = await runCommand(TwoFactorAuth, [])

    expect(stdout).to.equal('Two-factor authentication is not enabled\n')
  })
})
