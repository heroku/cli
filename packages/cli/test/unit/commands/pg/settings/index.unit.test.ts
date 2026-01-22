import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'
import runCommand from '../../../../helpers/runCommand.js'
import Cmd from '../../../../../src/commands/pg/settings/index.js'

const heredoc = tsheredoc.default

describe('pg:settings', function () {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    const addon = {
      id: 1,
      name: 'postgres-1',
      app: {name: 'myapp'},
      plan: {name: 'heroku-postgresql:standard-0'},
    }

    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'postgres-1',
        addon_service: 'heroku-postgresql',
      }).reply(200, [{addon}])

    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('shows settings', async function () {
    pg.get('/postgres/v0/databases/1/config').reply(200, {log_statement: {value: 'none'}})

    await runCommand(Cmd, ['--app', 'myapp', 'postgres-1'])

    expect(stdout.output).to.eq(heredoc`
      === postgres-1

      log-statement: none
    `)
  })
})
