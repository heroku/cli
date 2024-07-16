import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/maintenance/run'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import * as fixtures from '../../../../fixtures/addons/fixtures'
import heredoc from 'tsheredoc'

describe('pg:maintenance:run', function () {
  const addon = fixtures.addons['dwh-db']

  afterEach(function () {
    nock.cleanAll()
  })

  it('runs maintenance', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {maintenance: true})
    nock('https://api.data.heroku.com')
      .post(`/client/v11/databases/${addon.id}/maintenance`)
      .reply(200, {message: 'foo'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stderr.output, heredoc(`
      Starting maintenance for ${addon.name}...
      Starting maintenance for ${addon.name}... foo
    `))
    expectOutput(stdout.output, '')
  })
})
