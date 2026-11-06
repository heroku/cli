import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/pg/connection-pooling/attach.js'
import {resolvedAttachments} from '../../../../fixtures/addons/fixtures.js'

describe('pg:connection-pooling:attach', function () {
  const addon = {
    id: '1234',
    name: 'postgres-1',
    plan: {name: 'heroku-postgresql:standard-0'},
  }
  let api: nock.Scope
  let pg: nock.Scope
  const defaultCredential = 'default'
  const attachmentName = 'CONNECTION_POOL'

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {addon_attachment: 'postgres-1', app: 'myapp'})
      .reply(200, [resolvedAttachments['myapp::postgres-1']])
      .get('/addons/postgres-1')
      .reply(200, addon)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 0}])
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  context('includes an attachment name', function () {
    beforeEach(function () {
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {
        app: 'myapp', credential: defaultCredential, name: attachmentName,
      }).reply(201, {name: attachmentName})
    })

    it('attaches pgbouncer with attachment name', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        attachmentName,
        'postgres-1',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling Connection Pooling on')
      expect(stderr).to.contain(`Setting ${attachmentName} config vars and restarting ⬢ myapp... done, v0`)
    })
  })

  context('base command with no credential or attachment name', function () {
    beforeEach(function () {
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {
        app: 'myapp', credential: defaultCredential,
      }).reply(201, {name: 'HEROKU_COLOR'})
    })

    it('attaches pgbouncer with default credential', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-1',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling Connection Pooling on')
      expect(stderr).to.contain('Setting HEROKU_COLOR config vars and restarting ⬢ myapp... done, v0')
    })
  })

  context('database resolution and release lookup', function () {
    beforeEach(function () {
      // The shared beforeEach queues a resolve for an explicit database argument; these tests set up their own.
      nock.cleanAll()
      api = nock('https://api.heroku.com')
      pg = nock('https://api.data.heroku.com')
    })

    it('uses DATABASE_URL when no database is given and reports the newest release', async function () {
      api
        .post('/actions/addon-attachments/resolve', {addon_attachment: 'DATABASE_URL', app: 'myapp'})
        .reply(200, [resolvedAttachments['myapp::postgres-1']])
        .get('/apps/myapp/releases')
        .matchHeader('range', 'version ..; max=1, order=desc')
        .reply(200, [{version: 42}])
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {app: 'myapp', credential: defaultCredential})
        .reply(201, {name: 'DATABASE_CONNECTION_POOL'})

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp'])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling Connection Pooling on ⛁ postgres-1 to ⬢ myapp... done')
      expect(stderr).to.contain('Setting DATABASE_CONNECTION_POOL config vars and restarting ⬢ myapp... done, v42')
    })

    it('refuses an Essential-tier database without attaching', async function () {
      const essential = {
        ...resolvedAttachments['myapp::postgres-1'],
        addon: {...resolvedAttachments['myapp::postgres-1'].addon, plan: {name: 'heroku-postgresql:essential-0'}},
      }
      api
        .post('/actions/addon-attachments/resolve')
        .reply(200, [essential])

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-1'])

      expect(error?.message).to.equal('You can\'t perform this operation on Essential-tier databases.')
    })
  })
})
