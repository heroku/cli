import {expect} from 'chai'
import nock from 'nock'

import TwoFactorAuth from '../../../../src/commands/auth/2fa/index.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('2fa', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows 2fa is enabled', async function () {
    api
      .get('/account')
      .reply(200, {two_factor_authentication: true})

    const {stdout} = await runCommand(TwoFactorAuth, [])

    expect(stdout).to.equal('Two-factor authentication is enabled\n')
  })

  it('shows 2fa is not enabled', async function () {
    api
      .get('/account')
      .reply(200, {two_factor_authentication: false})

    const {stdout} = await runCommand(TwoFactorAuth, [])

    expect(stdout).to.equal('Two-factor authentication is not enabled\n')
  })
})
