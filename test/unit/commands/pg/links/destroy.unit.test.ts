import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/destroy.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc

describe('pg:links:destroy', function () {
  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
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

  describe('confirmation', function () {
    const addon = fixtures.addons['dwh-db']

    it('does not destroy the link when --confirm does not match the app', async function () {
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      const data = nock('https://api.data.heroku.com')

      const {error} = await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'not-myapp', 'dwh-db', 'postgres-link'])

      expect(ansis.strip(error?.message ?? '')).to.equal('Confirmation not-myapp did not match myapp. Aborted.')
      expect(data.isDone()).to.equal(true)
    })

    it('prompts for confirmation without --confirm, then destroys the link', async function () {
      const prompt = sinon.stub(hux, 'prompt').resolves('myapp')
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      nock('https://api.data.heroku.com')
        .delete(`/client/v11/databases/${addon.id}/links/postgres-link`)
        .reply(200)

      const {stderr} = await runCommand(Cmd, ['--app', 'myapp', 'dwh-db', 'postgres-link'])

      expect(prompt.calledOnce).to.equal(true)
      expect(stderr).to.contain('This command will affect the database dwh-db')
      expect(stderr).to.contain('This will delete postgres-link along with the tables and views created')
      expect(stderr).to.contain('Destroying link postgres-link from dwh-db... done')
    })

    it('encodes the link name in the delete request', async function () {
      nock('https://api.heroku.com')
        .post('/actions/addon-attachments/resolve')
        .reply(200, [{addon}])
      const data = nock('https://api.data.heroku.com')
        .delete(`/client/v11/databases/${addon.id}/links/my%20link`)
        .reply(200)

      await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp', 'dwh-db', 'my link'])

      expect(data.isDone()).to.equal(true)
    })
  })
})
