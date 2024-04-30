import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import * as nock from 'nock'
import heredoc from 'tsheredoc'

describe('pg:outliers', function () {
  let api: nock.Scope
  let fetchVersionCalled = false
  let queryString = ''
  let serverVersion = ''

  const expected_output_text = 'slow things'
  const db = {}
  const fetcher = {
    database: () => db,
  }
  const psql = {
    fetchVersion: () => {
      fetchVersionCalled = true
      return Promise.resolve(serverVersion)
    },
    exec: (_db: unknown, query: string) => {
      queryString = heredoc(query).trim()
      return Promise.resolve(expected_output_text)
    },
  }
  const {default: Cmd} = proxyquire('../../../../src/commands/pg/outliers', {
    '../../lib/pg/fetcher': fetcher,
    '../../lib/pg/psql': psql,
  })

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    fetchVersionCalled = false
    queryString = ''
    serverVersion = ''
    nock.cleanAll()
  })

  it('resets query stats', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--reset',
    ])

    expect(queryString).to.eq('SELECT pg_stat_statements_reset();')
  })

  it('returns query outliers', async function () {
    serverVersion = '11.16'

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(fetchVersionCalled).to.eq(true)
    expect(queryString).to.contain('total_time AS total_exec_time')
    expect(queryString).to.contain('FROM pg_stat_statements')
    expect(stdout.output.trim()).to.eq(expected_output_text)
  })

  it('uses an updated query for a newer version', async function () {
    serverVersion = '13.7'

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(fetchVersionCalled).to.eq(true)
    expect(queryString).to.contain('total_exec_time AS total_exec_time')
    expect(queryString).to.contain('FROM pg_stat_statements')
    expect(stdout.output.trim()).to.eq(expected_output_text)
  })
})
