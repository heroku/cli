/*
import {stderr, stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/pg/killall'
import * as nock from 'nock'
import heredoc from 'tsheredoc'


describe('pg:killall', function () {
  let pg: nock.Scope
  let api: nock.Scope
  const db = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}}

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    pg.done()
  })

  it('waits for all databases to be available', async function () {
    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp'})
      .reply(200, [{addon: db}])
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

*/
