import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/maintenance/window.js'
import runCommand from '../../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput.js'
import {expect} from 'chai'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default

describe('pg:maintenance', function () {
  const addon = fixtures.addons['dwh-db']

  afterEach(function () {
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
    expect(stderr.output).to.include(`Setting maintenance window for ${addon.name} to Sunday 06:30... done`)
  })
})
