import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import * as proxyquire from 'proxyquire'
import heredoc from 'tsheredoc'
import {CLIError} from '@oclif/core/lib/errors'
import runCommand from '../../../../helpers/runCommand'
import expectOutput from '../../../../helpers/utils/expectOutput'

const all = [
  {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}},
  {id: 2, name: 'postgres-2', plan: {name: 'heroku-postgresql:hobby-dev'}},
]
const fetcher =  {
  all: () => Promise.resolve(all),
  getAddon: () => Promise.resolve(all[0]),
}

const {default: Cmd} = proxyquire('../../../../../src/commands/pg/upgrade/wait', {
  '../../../lib/pg/fetcher': fetcher,
})

describe('pg:upgrade:wait', function () {
  let pg: nock.Scope

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    pg.done()
    nock.cleanAll()
  })

  it('waits till upgrade is finished', async function () {
    pg
      .get('/client/v11/databases/1/upgrade/wait_status').reply(200, {'waiting?': true, message: 'preparing upgrade service'})
      .get('/client/v11/databases/1/upgrade/wait_status').reply(200, {'waiting?': false, message: 'recreating followers', step: '(7/7)'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--wait-interval',
      '1',
      'DATABASE_URL',
    ])
    expect(stdout.output).to.equal('')
    expectOutput(stderr.output, heredoc(`
      Waiting for database postgres-1... preparing upgrade service
      Waiting for database postgres-1... (7/7) recreating followers
    `))
  })

  it('requires a database', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch(error => {
      expectOutput(error.message, heredoc(`
      You must provide a database. Run \`--help\` for more information on the command.
    `))
    })
  })

  it('displays errors', async function () {
    pg
      .get('/client/v11/databases/1/upgrade/wait_status').reply(200, {'error?': true, message: 'this is an error message'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE_URL',
    ]).catch(error => {
      const {message, oclif} = error as CLIError
      expect(message).to.equal('this is an error message')
      expect(oclif.exit).to.equal(1)
    })
  })
})
