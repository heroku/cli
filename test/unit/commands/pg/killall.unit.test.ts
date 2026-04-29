import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/pg/killall.js'

describe('pg:killall', function () {
  let pg: nock.Scope
  let api: nock.Scope
  const db = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'}}

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })

  it('waits for all databases to be available', async function () {
    api.post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', app: 'myapp'})
      .reply(200, [{addon: db}])
    pg.post('/client/v11/databases/1/connection_reset')
      .reply(200)

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout).to.eq('')
    expect(stderr).to.eq('Terminating connections for all credentials... done\n')
  })
})
