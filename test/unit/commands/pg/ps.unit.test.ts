import {runCommand} from '@heroku-cli/test-utils'
import {utils} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/ps.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

const FAKE_OUTPUT_TEXT = heredoc(`
  pid  | state  | source  | username | running_for | transaction_start | waiting | query
  -------+--------+---------+----------+-------------+-------------------+---------+-------
   17496 | active | standby | postgres |             |                   | t       |
   (1 row)

 `)

describe('pg:ps', function () {
  let api: nock.Scope
  let queryString = ''
  const addon = fixtures.addons['www-db']
  const app = fixtures.apps.api

  const mockConnectionDetails = {
    database: 'test-db',
    host: 'localhost',
    password: 'test-password',
    pathname: '/test-db',
    port: '5432',
    url: 'postgres://test-user:test-password@localhost:5432/test-db',
    user: 'test-user',
  }

  beforeEach(function () {
    sinon.stub(utils.pg.DatabaseResolver.prototype, 'getDatabase').resolves(mockConnectionDetails)
    sinon.stub(utils.pg.PsqlService.prototype, 'execQuery').callsFake((query: string) => {
      queryString = heredoc(query)
      return Promise.resolve(FAKE_OUTPUT_TEXT)
    })

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
    const {stdout} = await runCommand(Cmd, [
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
    expect(stdout).to.equal(FAKE_OUTPUT_TEXT)
  })

  it('runs verbose query', async function () {
    const {stdout} = await runCommand(Cmd, [
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
    expect(stdout).to.equal(FAKE_OUTPUT_TEXT)
  })
})
