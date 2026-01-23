import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../../src/commands/pg/maintenance/window.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

describe('pg:maintenance:window', function () {
  let addon: Heroku.AddOn

  afterEach(function () {
    addon = fixtures.addons['dwh-db']
    nock.cleanAll()
  })

  it('sets maintenance window', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .put(`/client/v11/databases/${addon.id}/maintenance_window`, {description: 'Sunday 06:30'})
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      'Sunday 06:30',
    ])
    expectOutput(stdout.output, '')
    expect(stderr.output).to.include(`Setting maintenance window for ⛁ ${addon.name} to Sunday 06:30... done`)
  })
})
