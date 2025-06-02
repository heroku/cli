import {expect} from 'chai'
import nock from 'nock'
import {runCommand} from '@oclif/test'

describe('2fa', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('shows 2fa is enabled', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {two_factor_authentication: true})

    const {stdout} = await runCommand(['auth:2fa'])
    expect(stdout).to.include('Two-factor authentication is enabled')
  })

  it('shows 2fa is not enabled', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {two_factor_authentication: false})

    const {stdout} = await runCommand(['auth:2fa'])
    expect(stdout).to.include('Two-factor authentication is not enabled')
  })
})
