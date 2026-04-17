import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Whoami from '../../../../src/commands/auth/whoami.js'

describe('auth:whoami', function () {
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

  it('shows user email when logged in', async function () {
    api
      .get('/account')
      .reply(200, {email: 'gandalf@example.com'})

    const {stderr, stdout} = await runCommand(Whoami, [])

    expect(stdout).to.equal('gandalf@example.com\n')
    expect(stderr).to.contain('Warning: HEROKU_API_KEY is set')
  })

  it('exits with status 100 when not logged in', async function () {
    api
      .get('/account')
      .reply(401)

    const {error, stderr} = await runCommand(Whoami, [])

    expect(error?.oclif?.exit).to.equal(100)
    expect(stderr).to.contain('Warning: HEROKU_API_KEY is set')
  })
})
