import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/pg/settings/index'

describe('pg:settings', () => {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(() => {
    const addon = {
      id: 1,
      name: 'postgres-1',
      app: {name: 'myapp'},
      plan: {name: 'heroku-postgresql:standard-0'},
    }

    api = nock('https://api.heroku.com')
      .post('/actions/addons/resolve', {
        app: 'myapp',
        addon: 'postgres-1',
      }).reply(200, [addon])

    pg = nock('https://api.data.heroku.com')
  })

  afterEach(() => {
    api.done()
    pg.done()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('shows settings', async () => {
    pg.get('/postgres/v0/databases/1/config').reply(200, {log_statement: {value: 'none'}})

    await runCommand(Cmd, ['--app', 'myapp', 'postgres-1'])

    expect(stdout.output).to.eq(heredoc`
      === postgres-1
      
      log-statement: none
    `)
  })
})
