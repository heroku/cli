import nock from 'nock'
import {stderr} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/reset.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('pg:reset', function () {
  const addon = fixtures.addons['dwh-db']

  afterEach(function () {
    nock.cleanAll()
  })

  it('reset db', async function () {
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
      Resetting ${addon.name}... done
    `))
  })

  context('with extensions', function () {
    beforeEach(function () {
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      nock('https://api.data.heroku.com')
        .put(`/client/v11/databases/${addon.id}/reset`, {extensions: ['postgis', 'uuid-ossp']})
        .reply(200, {
          message: 'Reset successful.',
        })
    })

    it('resets a db with pre-installed extensions', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--extensions',
        'uuid-ossp, Postgis',
      ])
      expectOutput(stderr.output, heredoc(`
        Resetting ${addon.name}... done
      `))
    })
  })
})
