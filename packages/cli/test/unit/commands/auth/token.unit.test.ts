import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('auth:token', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    process.env.HEROKU_API_KEY = 'foobar'
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    api.done()
    nock.cleanAll()
  })

  it('shows auth token', async function () {
    api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {expires_in: 60, token: 'foobar'}, user: {email: 'foo@bar.com'}},
        {},
      ])

    const {stderr, stdout} = await runCommand(['auth:token'])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('Warning: token will expire today')
  })

  it('shows "long-term" token generation warning for non-internal users', async function () {
    api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {expires_in: 60, token: 'foobar'}, user: {email: 'foo@bar.com'}},
        {},
      ])

    const {stderr, stdout} = await runCommand(['auth:token'])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('To generate a token that expires in one year, use heroku')
    expect(stderr).to.contain('authorizations:create.')
    expect(stderr).to.not.contain('All tokens expire one year after we generate it.')
  })

  it('shows AT2 token generation warning for internal users', async function () {
    api
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {expires_in: 60, token: 'foobar'}, user: {email: 'foo@heroku.com'}},
        {},
      ])

    const {stderr, stdout} = await runCommand(['auth:token'])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('All tokens expire one year after we generate it.')
    expect(stderr).to.not.contain('To generate a token that expires in one year, use heroku authorizations:create.')
  })
})
