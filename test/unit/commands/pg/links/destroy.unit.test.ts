import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/destroy.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

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
      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        addon.name || '',
        'postgres-link',
      ])
      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
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
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        addon.name || '',
        'postgres-link',
      ])

      expectOutput(stdout, '')
      expectOutput(stderr, heredoc(`
        Destroying link postgres-link from ${addon.name}... done
      `))
    })
  })
})
