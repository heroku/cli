import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore, stub} from 'sinon'

import Whoami from '../../../../src/commands/auth/whoami.js'

describe('auth:whoami', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    stub(APIClient.prototype, 'auth').get(() => 'foobar')
  })

  afterEach(function () {
    delete process.env.HEROKU_API_KEY
    api.done()
    nock.cleanAll()
    restore()
  })

  it('shows user email when logged in', async function () {
    api
      .get('/account')
      .reply(200, {email: 'gandalf@example.com'})

    const {stdout} = await runCommand(Whoami, [])

    expect(stdout).to.equal('gandalf@example.com\n')
  })

  it('exits with status 100 when not logged in', async function () {
    api
      .get('/account')
      .reply(401)

    const {error} = await runCommand(Whoami, [])

    expect(error?.oclif?.exit).to.equal(100)
  })

  it('shows a warning when the HEROKU_API_KEY env var is set', async function () {
    process.env.HEROKU_API_KEY = 'foobar'
    api
      .get('/account')
      .reply(200, {email: 'gandalf@example.com'})

    const {stderr, stdout} = await runCommand(Whoami, [])

    expect(stderr).to.contain('Warning: HEROKU_API_KEY is set')
    expect(stdout).to.equal('gandalf@example.com\n')
  })
})
