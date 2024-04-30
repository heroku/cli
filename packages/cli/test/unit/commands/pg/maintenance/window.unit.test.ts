import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/maintenance/window'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as fixtures from '../../../../fixtures/addons/fixtures'
import heredoc from 'tsheredoc'

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
    expectOutput(stderr.output, heredoc(`
      Setting maintenance window for ${addon.name} to Sunday 06:30...
      Setting maintenance window for ${addon.name} to Sunday 06:30... done
    `))
  })
})
