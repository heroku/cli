import {stderr, stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import * as nock from 'nock'
import heredoc from 'tsheredoc'

describe.only('pg:killall', () => {
  let pg: nock.Scope
  const db = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}}
  const fetcher = {
    getAddon: () => db,
  }
  const {default: Cmd} = proxyquire('../../../../src/commands/pg/killall', {
    '../../lib/pg/fetcher': fetcher,
  })

  beforeEach(() => {
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  it('waits for all databases to be available', async () => {
    pg.post('/client/v11/databases/1/connection_reset')
      .reply(200)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.eq('')
    expect(stderr.output).to.eq(heredoc`
      Terminating connections for all credentials...
      Terminating connections for all credentials... done
    `)
  })
})
