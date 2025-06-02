import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('auth:whoami', function () {
  beforeEach(function () {
    process.env.HEROKU_API_KEY = 'foobar'
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    nock.cleanAll()
  })

  it('shows user email when logged in', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {email: 'jeff@example.com'})

    const {stdout, stderr} = await runCommand(['auth:whoami'])
    expect(stdout).to.equal('jeff@example.com\n')
    expect(stderr).to.contain('Warning: HEROKU_API_KEY is set')
  })

  it('exits with status 100 when not logged in', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(401)

    try {
      await runCommand(['auth:whoami'])
      expect.fail('Expected command to fail')
    } catch (error: any) {
      expect(error.exit).to.equal(100)
      expect(error.stderr).to.contain('Warning: HEROKU_API_KEY is set')
    }
  })
})
