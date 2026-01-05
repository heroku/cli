/*
import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand, {GenericCmd} from '../../../helpers/runCommand.js'
import * as proxyquire from 'proxyquire'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import * as sinon from 'sinon'

const FAKE_OUTPUT_TEXT = heredoc(`
  pid  | state  | source  | username | running_for | transaction_start | waiting | query
  -------+--------+---------+----------+-------------+-------------------+---------+-------
   17496 | active | standby | postgres |             |                   | t       |
   (1 row)

 `)

describe('pg:ps', function () {
  let databaseResolverStub: sinon.SinonStub
  let psqlServiceExecQuerySpy: sinon.SinonSpy
  let Cmd: GenericCmd
  let api: nock.Scope
  let queryString = ''
  const addon = fixtures.addons['www-db']
  const app = fixtures.apps.api
  const psql = {
    fetchVersion: () => {
      return Promise.resolve('')
    },
  }

  beforeEach(function () {
    databaseResolverStub = sinon.stub().resolves({})
    psqlServiceExecQuerySpy = sinon.spy((query: string) => {
      queryString = heredoc(query)
      return Promise.resolve(FAKE_OUTPUT_TEXT)
    })

    // Mock the utils.pg classes
    const mockUtils = {
      pg: {
        DatabaseResolver: class {
          getDatabase = databaseResolverStub
        },
        PsqlService: class {
          execQuery = psqlServiceExecQuerySpy
        },
      },
    }

    Cmd = proxyquire('../../../../src/commands/pg/ps', {
      '../../lib/pg/psql': psql,
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
    }).default
    api = nock('https://api.heroku.com:443')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon, app, config_vars: ['DATABASE_URL']}])
      .get(`/apps/${app.name}/config-vars`)
      .reply(200, {DATABASE_URL: 'postgres://test-database'})
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    sinon.restore()
  })

  it('runs query', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(queryString).to.equal(heredoc(`
SELECT pid,
           state,
           application_name AS SOURCE,
           usename AS username,
           age(now(), xact_start) AS running_for,
           xact_start AS transaction_start, wait_event IS NOT NULL AS waiting, query
    FROM pg_stat_activity
    WHERE query <> '<insufficient privilege>' AND state <> 'idle'
      AND pid <> pg_backend_pid()
    ORDER BY query_start DESC
`))
    expect(stdout.output).to.equal(FAKE_OUTPUT_TEXT)
  })

  it('runs verbose query', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])
    expect(queryString).to.equal(heredoc(`
SELECT pid,
           state,
           application_name AS SOURCE,
           usename AS username,
           age(now(), xact_start) AS running_for,
           xact_start AS transaction_start, wait_event IS NOT NULL AS waiting, query
    FROM pg_stat_activity
    WHERE query <> '<insufficient privilege>'
      AND pid <> pg_backend_pid()
    ORDER BY query_start DESC
`))
    expect(stdout.output).to.equal(FAKE_OUTPUT_TEXT)
  })
})

*/
