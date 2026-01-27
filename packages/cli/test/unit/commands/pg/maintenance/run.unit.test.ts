import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../../src/commands/pg/maintenance/run.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

describe('pg:maintenance:run', function () {
  const addon = fixtures.addons['dwh-db']
  let api: nock.Scope
  let dataApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    dataApi = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    api.done()
    dataApi.done()
    nock.cleanAll()
  })

  it('runs maintenance', async function () {
    api
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    api
      .get('/apps/myapp')
      .reply(200, {maintenance: true})
    dataApi
      .post(`/client/v11/databases/${addon.id}/maintenance`)
      .reply(200, {message: 'foo'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(stderr.output).to.include(`Starting maintenance for ⛁ ${addon.name}... foo`)
    expectOutput(stdout.output, '')
  })
})
