import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/pg/connection-pooling/attach.js'
import {resolvedAttachments} from '../../../../fixtures/addons/fixtures.js'
import {runCommand} from '../../../../helpers/run-command.js'

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
})
