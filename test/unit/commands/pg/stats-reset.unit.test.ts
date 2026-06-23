import {runCommand} from '@heroku-cli/test-utils'
import {pg, utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import {
  createSandbox, SinonSandbox, SinonStub,
} from 'sinon'

import Cmd from '../../../../src/commands/pg/stats-reset.js'

const buildMockDb = (planName: string): pg.ConnectionDetails => ({
  attachment: {
    addon: {
      id: 'c667bce0-3c19-4372-8d5c-3eb1ff5d0e9a',
      name: 'postgres-1',
      plan: {name: planName},
    },
    name: 'DATABASE',
  },
  database: 'testdb',
  host: 'localhost',
  password: 'testpass',
  pathname: '/testdb',
  port: '5432',
  url: 'postgres://localhost:5432/testdb',
  user: 'testuser',
} as unknown as pg.ConnectionDetails)

describe('pg:stats-reset', function () {
  let sandbox: SinonSandbox
  let getDatabaseStub: SinonStub
  let getAttachmentStub: SinonStub
  let pgApi: nock.Scope
  const addonId = 'c667bce0-3c19-4372-8d5c-3eb1ff5d0e9a'

  beforeEach(function () {
    sandbox = createSandbox()
    getDatabaseStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase')
      .resolves(buildMockDb('heroku-postgresql:premium-0'))
    getAttachmentStub = sandbox.stub(utils.pg.DatabaseResolver.prototype, 'getAttachment')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .resolves({addon: {id: addonId, name: 'DATABASE'}} as any)
    pgApi = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    sandbox.restore()
    nock.cleanAll()
  })

  it('resets the statistics and prints the returned message', async function () {
    pgApi.put(`/client/v11/databases/${addonId}/stats_reset`)
      .reply(200, {message: 'stats reset'})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(getDatabaseStub.calledOnce).to.be.true
    expect(getAttachmentStub.calledOnce).to.be.true
    expect(stdout.trim()).to.eq('stats reset')
    expect(stderr).to.eq('')
    pgApi.done()
  })

  it('sends the stats_reset request to the Postgres data API host with no body', async function () {
    // Confirm the data API host nock matches what utils.pg.host() resolves to by default.
    expect(utils.pg.host()).to.eq('api.data.heroku.com')

    let capturedBody: unknown
    // The body matcher returns true only for an empty body, so the interceptor
    // only matches (and pgApi.done() only succeeds) when no request body is sent.
    pgApi.put(`/client/v11/databases/${addonId}/stats_reset`, body => {
      capturedBody = body
      return body === '' || body === undefined || (typeof body === 'object' && Object.keys(body).length === 0)
    })
      .reply(200, {message: 'stats reset'})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    // pgApi.done() asserts the interceptor on api.data.heroku.com was hit at the
    // exact path, which proves the hostname option routed the PUT to the data API host.
    pgApi.done()
    expect(capturedBody === '' || (typeof capturedBody === 'object' && Object.keys(capturedBody as object).length === 0)).to.be.true
    expect(stdout.trim()).to.eq('stats reset')
    expect(stderr).to.eq('')
  })

  it('accepts a database argument', async function () {
    pgApi.put(`/client/v11/databases/${addonId}/stats_reset`)
      .reply(200, {message: 'stats reset'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'postgres-123',
    ])

    expect(getDatabaseStub.getCall(0).args[1]).to.eq('postgres-123')
    expect(getAttachmentStub.getCall(0).args[1]).to.eq('postgres-123')
    pgApi.done()
  })

  it('rejects Essential-tier databases', async function () {
    getDatabaseStub.resolves(buildMockDb('heroku-postgresql:essential-0'))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(error?.message).to.include('This operation is not supported by Essential-tier databases.')
  })

  it('surfaces an error when resolving the database fails', async function () {
    getDatabaseStub.rejects(new Error('Couldn\'t find that database.'))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(error?.message).to.include('Couldn\'t find that database.')
  })
})
