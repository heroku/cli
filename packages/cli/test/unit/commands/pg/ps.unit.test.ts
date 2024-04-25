import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd  from '../../../../src/commands/pg/ps'
import * as fixtures from '../../../fixtures/addons/fixtures'
import runCommand from '../../../helpers/runCommand'
import * as sinon from 'sinon'
import * as psql from '../../../../src/lib/pg/psql'

const FAKE_OUTPUT_TEXT = heredoc(`
  pid  | state  | source  | username | running_for | transaction_start | waiting | query
  -------+--------+---------+----------+-------------+-------------------+---------+-------
   17496 | active | standby | postgres |             |                   | t       |
   (1 row)
   
 `)

describe('pg:ps', () => {
  let api: nock.Scope
  const stub = sinon.stub(psql, 'exec').resolves(FAKE_OUTPUT_TEXT)
  const addon = fixtures.addons['www-db']
  const app = fixtures.apps.api
  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon, app, config_vars: ['DATABASE_URL']}])
      .get(`/apps/${app.name}/config-vars`)
      .reply(200, {DATABASE_URL: 'postgres://test-database'})
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('runs query', async () => {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(stub.lastCall.lastArg).to.equal(heredoc(`
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

  it('runs verbose query', async () => {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])
    expect(stub.lastCall.lastArg).to.equal(heredoc(`
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
