import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import nock from 'nock'
import runCommand from '../../../helpers/runCommand.js'
import Cmd from '../../../../src/commands/pg/info.js'

describe('pg:info', function () {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
    pg = nock('https://api.data.heroku.com:443')
  })

  afterEach(function () {
    api.done()
    pg.done()
    nock.cleanAll()
  })
  context('with 0 dbs', function () {
    it('shows empty state', async function () {
      api.get('/apps/myapp/config-vars')
        .reply(200, {})
        .get('/apps/myapp/addon-attachments')
        .reply(200, [])
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('⬢ myapp has no heroku-postgresql databases.\n')
      expect(stderr.output).to.equal('')
    })
  })
  context('with 2 dbs', function () {
    const plan = {name: 'heroku-postgresql:hobby-dev'}
    const config = {
      DATABASE_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx', HEROKU_POSTGRESQL_COBALT_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx', HEROKU_POSTGRESQL_PURPLE_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec3-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx',
    }
    const addons = [
      {id: 1, name: 'postgres-1', plan, app: {name: 'myapp2'}}, {id: 2, name: 'postgres-2', plan, app: {name: 'myapp'}},
    ]
    const dbA = {info: [
      {name: 'Plan', values: ['Hobby-dev']}, {name: 'Empty', values: []}, {name: 'Following', resolve_db_name: true, values: ['postgres://ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx']},
    ], resource_url: config.DATABASE_URL}
    const dbB = {info: [
      {name: 'Plan', values: ['Hobby-dev']}, {name: 'Following', resolve_db_name: true, values: ['postgres://ec2-55-111-111-1.compute-1.amazonaws.com/dxxxxxxxxxxxx']},
    ], resource_url: config.HEROKU_POSTGRESQL_PURPLE_URL}
    it('shows postgres info', async function () {
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          {addon: addons[0], name: 'HEROKU_POSTGRESQL_COBALT', config_vars: ['HEROKU_POSTGRESQL_COBALT_URL']},
          {addon: addons[0], name: 'DATABASE', config_vars: ['DATABASE_URL']},
          {addon: addons[1], name: 'HEROKU_POSTGRESQL_PURPLE', config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL']},
        ])
      pg.get('/client/v11/databases/1')
        .reply(200, dbA)
        .get('/client/v11/databases/2')
        .reply(200, dbB)
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== HEROKU_POSTGRESQL_COBALT_URL, DATABASE_URL\n\nPlan:        Hobby-dev\nFollowing:   HEROKU_POSTGRESQL_COBALT\nBilling App: ⬢ myapp2\nAdd-on:      postgres-1\n\n=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
      expect(stderr.output).to.equal('')
    })
    it('shows postgres info using attachment names', async function () {
      const all = [
        {
          id: 1,
          name: 'postgres-1',
          plan,
          app: {name: 'myapp2'},
          attachment_names: ['DATABASE', 'ATTACHMENT_NAME'],
        }, {id: 2, name: 'postgres-2', plan, app: {name: 'myapp'}, attachment_names: ['HEROKU_POSTGRESQL_PURPLE']},
      ]
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          {addon: all[0], name: 'DATABASE', config_vars: ['DATABASE_URL']},
          {addon: all[0], name: 'ATTACHMENT_NAME', config_vars: ['ATTACHMENT_NAME_URL']},
          {addon: all[1], name: 'HEROKU_POSTGRESQL_PURPLE', config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL']},
        ])
      pg.get('/client/v11/databases/1')
        .reply(200, dbA)
        .get('/client/v11/databases/2')
        .reply(200, dbB)

      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== DATABASE_URL, ATTACHMENT_NAME_URL\n\nPlan:        Hobby-dev\nFollowing:   HEROKU_POSTGRESQL_COBALT\nBilling App: ⬢ myapp2\nAdd-on:      postgres-1\n\n=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
    })
    it('shows postgres info for single database when arg sent in', async function () {
      const addon = addons[1]
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
        .post('/actions/addon-attachments/resolve', {addon_attachment: 'postgres-2', addon_service: 'heroku-postgresql', app: 'myapp'})
        .reply(200, [{addon}])
      pg.get('/client/v11/databases/2')
        .reply(200, dbB)

      await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-2',
      ])
      expect(stdout.output).to.equal('=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
      expect(stderr.output).to.equal('')
    })
    it('shows warning for 404', async function () {
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          {addon: addons[0], name: 'HEROKU_POSTGRESQL_COBALT', config_vars: ['HEROKU_POSTGRESQL_COBALT_URL']},
          {addon: addons[0], name: 'DATABASE', config_vars: ['DATABASE_URL']},
          {addon: addons[1], name: 'HEROKU_POSTGRESQL_PURPLE', config_vars: ['HEROKU_POSTGRESQL_PURPLE_URL']},
        ])
      pg.get('/client/v11/databases/1')
        .reply(404)
        .get('/client/v11/databases/2')
        .reply(200, dbB)

      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
      expect(stderr.output).to.include('postgres-1 is not yet provisioned.')
      expect(stderr.output).to.include('Run heroku addons:wait to wait until the db is provisioned.')
    })
  })
})
