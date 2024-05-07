import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'

const all = [
  {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}},
  {id: 2, name: 'postgres-2', plan: {name: 'heroku-postgresql:hobby-dev'}},
]
const fetcher =  {
  all: () => Promise.resolve(all),
  getAddon: () => Promise.resolve(all[0]),
}

const {default: Cmd} = proxyquire('../../../../src/commands/pg/wait', {
  '../../lib/pg/fetcher': fetcher,
})

describe('pg:wait', function () {
  let pg: nock.Scope

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    pg.done()
    nock.cleanAll()
  })

  it('waits for a database to be available', async function () {
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': true, message: 'pending'})
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false, message: 'available'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--wait-interval',
      '1',
      'DATABASE_URL',
    ])
    expect(stdout.output).to.equal('')
    expectOutput(stderr.output, heredoc(`
      Waiting for database postgres-1... pending
      Waiting for database postgres-1... available
    `))
  })

  it('waits for all databases to be available', async function () {
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false})
      .get('/client/v11/databases/2/wait_status').reply(200, {'waiting?': false})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
  })

  it('displays errors', async function () {
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'error?': true, message: 'this is an error message'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch(error => {
      if (error.code !== 1) throw error
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal('this is an error message\n')
    })
  })
})
