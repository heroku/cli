import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/links/destroy'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as fixtures from '../../../../fixtures/addons/fixtures'
import heredoc from 'tsheredoc'

describe('pg:links:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  describe('on an essential database', function () {
    const addon = fixtures.addons['www-db']

    it('errors when attempting to destroy a link', async function () {
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        addon.name || '',
        'postgres-link',
      ])
        .catch(error => {
          expect(error.message).to.equal('pg:links isn’t available for Essential-tier databases.')
        })
    })
  })

  describe('on a production database', function () {
    const addon = fixtures.addons['dwh-db']

    it('destroys a link', async function () {
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      nock('https://api.data.heroku.com')
        .delete(`/client/v11/databases/${addon.id}/links/postgres-link`)
        .reply(200)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        addon.name || '',
        'postgres-link',
      ])

      expectOutput(stdout.output, '')
      expectOutput(stderr.output, heredoc(`
        Destroying link postgres-link from ${addon.name}...
        Destroying link postgres-link from ${addon.name}... done
      `))
    })
  })
})
