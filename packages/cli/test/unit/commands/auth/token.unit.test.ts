import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('auth:token', function () {
  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
  })

  it('shows auth token', async () => {
    process.env.HEROKU_API_KEY = 'foobar'

    nock('https://api.heroku.com')
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}, user: {email: 'foo@bar.com'}},
        {},
      ])

    const {stdout, stderr} = await runCommand(['auth:token'])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('Warning: token will expire today')
  })

  it('shows "long-term" token generation warning for non-internal users', async () => {
    process.env.HEROKU_API_KEY = 'foobar'

    nock('https://api.heroku.com')
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}, user: {email: 'foo@bar.com'}},
        {},
      ])

    const {stdout, stderr} = await runCommand(['auth:token'])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('To generate a token that expires in one year, use heroku')
    expect(stderr).to.contain('authorizations:create.')
    expect(stderr).to.not.contain('All tokens expire one year after we generate it.')
  })

  it('shows AT2 token generation warning for internal users', async () => {
    process.env.HEROKU_API_KEY = 'foobar'

    nock('https://api.heroku.com')
      .get('/oauth/authorizations')
      .reply(200, [
        {access_token: {token: 'somethingelse'}},
        {access_token: {token: 'foobar', expires_in: 60}, user: {email: 'foo@heroku.com'}},
        {},
      ])

    const {stdout, stderr} = await runCommand(['auth:token'])

    expect(stdout).to.equal('foobar\n')
    expect(stderr).to.contain('All tokens expire one year after we generate it.')
    expect(stderr).to.not.contain('To generate a token that expires in one year, use heroku authorizations:create.')
  })
})
