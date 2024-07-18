import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/maintenance/index'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as fixtures from '../../../../fixtures/addons/fixtures'

describe('pg:maintenance', function () {
  const addon = fixtures.addons['dwh-db']

  afterEach(function () {
    nock.cleanAll()
  })

  it('shows maintenance', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/maintenance`).reply(200, {message: 'foo'})
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, 'foo\n')
  })
})
