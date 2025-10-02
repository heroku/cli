import {stdout} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import * as sinon from 'sinon'

describe('pg:outliers', function () {
  let databaseResolverStub: sinon.SinonStub
  let psqlServiceExecQuerySpy: sinon.SinonSpy
  let Cmd: GenericCmd
  let api: nock.Scope
  let fetchVersionCalled = false
  let queryString = ''
  let serverVersion = ''
  const expected_output_text = 'slow things'
  const psql = {
    fetchVersion: () => {
      fetchVersionCalled = true
      return Promise.resolve(serverVersion)
    },
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    databaseResolverStub = sinon.stub().resolves({})
    psqlServiceExecQuerySpy = sinon.spy((query: string) => {
      queryString = heredoc(query).trim()
      return Promise.resolve(expected_output_text)
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

    Cmd = proxyquire('../../../../src/commands/pg/outliers', {
      '../../lib/pg/psql': psql,
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
    }).default
  })

  afterEach(function () {
    api.done()
    fetchVersionCalled = false
    queryString = ''
    serverVersion = ''
    nock.cleanAll()
    sinon.restore()
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
