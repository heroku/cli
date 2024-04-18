import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import * as proxyquire from 'proxyquire'

describe('pg:connection-pooling:attach', () => {
  const addon = {
    name: 'postgres-1',
    id: '1234',
    plan: {name: 'heroku-postgresql:standard-0'},
  }
  const fetcher = () => {
    return {
      getAddon: () => addon,
    }
  }

  const {default: Cmd} = proxyquire('../../../../../src/commands/pg/connection-pooling/attach', {
    '../../../lib/pg/fetcher': fetcher(),
  })

  let api: nock.Scope
  let pg: nock.Scope
  const defaultCredential = 'default'
  const attachmentName = 'CONNECTION_POOL'

  beforeEach(() => {
    api = nock('https://api.heroku.com')
      .get('/addons/postgres-1')
      .reply(200, addon)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 0}])
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  context('includes an attachment name', () => {
    beforeEach(() => {
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {
        credential: defaultCredential, name: attachmentName, app: 'myapp',
      }).reply(201, {name: attachmentName})
    })

    it('attaches pgbouncer with attachment name', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        attachmentName,
        'postgres-1',
      ])

      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Enabling Connection Pooling on')
      expect(stderr.output).to.contain(`Setting ${attachmentName} config vars and restarting myapp... done, v0`)
    })
  })

  context('base command with no credential or attachment name', () => {
    beforeEach(() => {
      pg.post(`/client/v11/databases/${addon.name}/connection-pooling`, {
        credential: defaultCredential, app: 'myapp',
      }).reply(201, {name: 'HEROKU_COLOR'})
    })

    it('attaches pgbouncer with default credential', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-1',
      ])

      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Enabling Connection Pooling on')
      expect(stderr.output).to.contain('Setting HEROKU_COLOR config vars and restarting myapp... done, v0')
    })
  })
})
