import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/create.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

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
        addon_attachment: 'heroku-postgres', addon_service: 'heroku-postgresql', app: 'myapp',
      }).reply(200, [{addon}])

      api.post('/actions/addons/resolve', {
        addon: 'heroku-redis',
        app: 'myapp',
      }).reply(200, [addon])

      try {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'foobar',
          'heroku-redis',
          'heroku-postgres',
        ])
      } catch (error) {
        const {message} = error as { message: string }
        expect(message).to.equal('pg:links isn\'t available for Essential-tier databases.')
      }
    })
  })

  describe('on a production database', function () {
    const addon = {
      id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
    }

    it('errors when attempting to create a link', async function () {
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'heroku-postgres',
        addon_service: 'heroku-postgresql',
        app: 'myapp',
      }).reply(200, [{addon}])

      api.post('/actions/addons/resolve', {
        addon: 'heroku-redis',
        app: 'myapp',
      }).reply(200, [addon])

      pg.post('/client/v11/databases/1/links', {as: 'foobar', target: 'postgres-1'})
        .reply(200, {name: 'foobar'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'foobar',
        'heroku-redis',
        'heroku-postgres',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(heredoc(`
      Adding link from ⛁ postgres-1 to ⛁ postgres-1... done, foobar
      `))
    })
  })
})
