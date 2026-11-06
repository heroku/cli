import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/create.js'

const heredoc = tsheredoc

describe('pg:links:create', function () {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  describe('on an essential database', function () {
    const addon = {
      id: 2, name: 'postgres-1', plan: {name: 'heroku-postgresql:basic'},
    }

    it('errors when attempting to create a link', async function () {
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'heroku-postgres', app: 'myapp',
      }).reply(200, [{addon}])

      api.post('/actions/addons/resolve', {
        addon: 'heroku-redis',
        app: 'myapp',
      }).reply(200, [addon])

      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'foobar',
        'heroku-redis',
        'heroku-postgres',
      ])
      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
    })
  })

  describe('on a production database', function () {
    const addon = {
      id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
    }

    it('errors when attempting to create a link', async function () {
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'heroku-postgres',
        app: 'myapp',
      }).reply(200, [{addon}])

      api.post('/actions/addons/resolve', {
        addon: 'heroku-redis',
        app: 'myapp',
      }).reply(200, [addon])

      pg.post('/client/v11/databases/1/links', {as: 'foobar', target: 'postgres-1'})
        .reply(200, {name: 'foobar'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'foobar',
        'heroku-redis',
        'heroku-postgres',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.equal(heredoc(`
      Adding link from ⛁ postgres-1 to ⛁ postgres-1... done, foobar
      `))
    })
  })

  describe('remote resolution and validation', function () {
    const db = {
      id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
    }

    it('creates a link without --as', async function () {
      const redis = {
        app: {name: 'myapp'}, id: 'r1', name: 'redis-1', plan: {name: 'heroku-redis:premium-0'},
      }
      api.post('/actions/addon-attachments/resolve').reply(200, [{addon: db}])
      api.post('/actions/addons/resolve', {addon: 'redis-1', app: 'myapp'}).reply(200, [redis])
      pg.post('/client/v11/databases/1/links', {target: 'redis-1'})
        .reply(200, {name: 'generated-link'})

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp', 'redis-1', 'DATABASE_URL'])

      expect(stdout).to.equal('')
      expect(stderr).to.equal('Adding link from ⛁ redis-1 to ⛁ postgres-1... done, generated-link\n')
    })

    it('errors when the remote is not a Heroku Postgres or Key-Value Store add-on', async function () {
      const papertrail = {
        app: {name: 'myapp'}, id: 'p1', name: 'papertrail-1', plan: {name: 'papertrail:basic'},
      }
      api.post('/actions/addon-attachments/resolve').reply(200, [{addon: db}])
      api.post('/actions/addons/resolve').reply(200, [papertrail])

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'papertrail-1', 'DATABASE_URL'])

      expect(error?.message).to.equal('Remote database must be heroku-redis or heroku-postgresql')
    })

    it('errors when the remote is an Essential-tier database', async function () {
      const essentialRemote = {
        app: {name: 'myapp'}, id: 'e1', name: 'postgres-essential', plan: {name: 'heroku-postgresql:essential-0'},
      }
      api.post('/actions/addon-attachments/resolve').reply(200, [{addon: db}])
      api.post('/actions/addons/resolve').reply(200, [essentialRemote])

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-essential', 'DATABASE_URL'])

      expect(error?.message).to.equal('pg:links isn\'t available for Essential-tier databases.')
    })
  })
})
