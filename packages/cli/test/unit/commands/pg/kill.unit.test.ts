import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'

describe('pg:kill', function () {
  let queryString = ''
  const db = {}
  const psql = {
    exec: (_db: unknown, query: string) => {
      queryString = heredoc(query).trim()
      return Promise.resolve('')
    },
  }
  const fetcher = {
    database: () => db,
  }
  const {default: Cmd} = proxyquire('../../../../src/commands/pg/kill', {
    '../../lib/pg/fetcher': fetcher,
    '../../lib/pg/psql': psql,
  })

  afterEach(function () {
    queryString = ''
  })

  it('kills pid 100', async function () {
    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
    ])

    expect(queryString).to.eq('SELECT pg_cancel_backend(100);')
  })

  it('force kills pid 100', async function () {
    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
      '--force',
    ])

    expect(queryString).to.eq('SELECT pg_terminate_backend(100);')
  })
})
