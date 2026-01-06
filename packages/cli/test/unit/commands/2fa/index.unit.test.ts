import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('2fa', function () {
  afterEach(() => nock.cleanAll())

  it('shows 2fa is enabled', async () => {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {two_factor_authentication: true})

    const {stdout} = await runCommand(['2fa'])

    expect(stdout).to.equal('Two-factor authentication is enabled\n')
  })

  it('shows 2fa is not enabled', async () => {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {two_factor_authentication: false})

    const {stdout} = await runCommand(['2fa'])

    expect(stdout).to.equal('Two-factor authentication is not enabled\n')
  })
})
