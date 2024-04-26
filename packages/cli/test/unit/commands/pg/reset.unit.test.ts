import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/pg/reset'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import * as fixtures from '../../../fixtures/addons/fixtures'

describe('pg:reset', () => {
  const addon = fixtures.addons['dwh-db']

  afterEach(() => {
    nock.cleanAll()
  })

  it('reset db', async () => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .put(`/client/v11/databases/${addon.id}/reset`)
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(stderr.output, heredoc(`
      Resetting ${addon.name}...
      Resetting ${addon.name}... done
    `))
  })

  context('with extensions', () => {
    beforeEach(() => {
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      nock('https://api.data.heroku.com')
        .put(`/client/v11/databases/${addon.id}/reset`, {extensions: ['postgis', 'uuid-ossp']})
        .reply(200, {
          message: 'Reset successful.',
        })
    })

    it('resets a db with pre-installed extensions', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--extensions',
        'uuid-ossp, Postgis',
      ])
      expectOutput(stderr.output, heredoc(`
        Resetting ${addon.name}...
        Resetting ${addon.name}... done
      `))
    })
  })
})
