import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import TwoFactorAuth from '../../../../src/commands/auth/2fa/index.js'

type FakePlatform = {
  account: {info: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    account: {info: stub()},
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
    fakePlatform.account.info.resolves({two_factor_authentication: true})

    const {stdout} = await runCommand(TwoFactorAuth, [])

    expect(stdout).to.equal('Two-factor authentication is enabled\n')
  })

  it('shows 2fa is not enabled', async function () {
    fakePlatform.account.info.resolves({two_factor_authentication: false})

    const {stdout} = await runCommand(TwoFactorAuth, [])

    expect(stdout).to.equal('Two-factor authentication is not enabled\n')
  })
})
