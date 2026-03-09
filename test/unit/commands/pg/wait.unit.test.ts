import Cmd from '../../../../src/commands/pg/wait.js'
import {expect} from 'chai'
import nock from 'nock'
import {Errors} from '@oclif/core'
import {runCommand} from '../../../helpers/run-command.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const all = [
  {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}},
  {id: 2, name: 'postgres-2', plan: {name: 'heroku-postgresql:hobby-dev'}},
]

describe('pg:wait', function () {
  let pg: nock.Scope
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('waits for a database to be available', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: all[0]}])
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': true, message: 'pending'})
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false, message: 'available'})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--wait-interval',
      '1',
      'DATABASE_URL',
    ])
    expect(stdout).to.equal('')
    expectOutput(stderr, 'Waiting for database postgres-1... available')
  })

  it('waits for all databases to be available', async function () {
    api
      .get('/apps/myapp/addon-attachments')
      .reply(200, all.map(db => ({addon: db})))
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false})
      .get('/client/v11/databases/2/wait_status').reply(200, {'waiting?': false})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('displays errors', async function () {
    api
      .get('/apps/myapp/addon-attachments')
      .reply(200, [{addon: all[0]}])
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'error?': true, message: 'this is an error message'})

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    const {message, oclif} = error as Errors.CLIError
    expect(message).to.equal('this is an error message')
    expect(oclif.exit).to.equal(1)
  })

  it('receives steps but does not display them', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: all[0]}])
    pg
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': true, message: 'upgrading', step: '1/3'})
      .get('/client/v11/databases/1/wait_status').reply(200, {'waiting?': false, message: 'available'})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--wait-interval',
      '1',
      'DATABASE_URL',
    ])
    expect(stdout).to.equal('')
    expectOutput(stderr, 'Waiting for database postgres-1... available')
  })
})
