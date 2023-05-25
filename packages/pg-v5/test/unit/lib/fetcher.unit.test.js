'use strict'
/* global beforeEach afterEach */

const nock = require('nock')
const {expect} = require('chai')
const proxyquire = require('proxyquire')
const resolver = {}
const fetcher = proxyquire('../../../lib/fetcher', {'@heroku-cli/plugin-addons': {resolve: resolver}})
const Heroku = require('heroku-client')
const sinon = require('sinon')
const url = require('url')
const util = require('../../../lib/util')

beforeEach(function () {
  const getConfig = require('../../../lib/config')
  getConfig.clear()
})

describe('fetcher', () => {
  let api
  let stub

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')

    stub = sinon.stub()
    stub.throws('not stubbed')

    resolver.appAttachment = stub
    nock.cleanAll()
  })

  afterEach(() => {
    api.done()
    delete process.env.HEROKU_POSTGRESQL_ADDON_NAME
  })

  describe('addon', () => {
    it('returns addon attached to app', () => {
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL', {addon_service: 'heroku-postgresql', namespace: null}).returns(Promise.resolve({addon: {name: 'postgres-1'}}))
      return fetcher(new Heroku()).addon('myapp', 'DATABASE_URL')
        .then(addon => {
          expect(addon.name).to.equal('postgres-1')
        })
    })

    it('returns addon attached to app in another shogun', () => {
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL', {addon_service: 'heroku-postgresql-meta', namespace: null}).returns(Promise.resolve({addon: {name: 'postgres-1'}}))
      process.env.HEROKU_POSTGRESQL_ADDON_NAME = 'heroku-postgresql-meta'
      return fetcher(new Heroku()).addon('myapp', 'DATABASE_URL')
        .then(addon => {
          expect(addon.name).to.equal('postgres-1')
        })
    })
  })

  describe('database', () => {
    it('returns db connection info', () => {
      let addonApp = {name: 'addon-app'}
      let app = {name: 'myapp'}
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL', {addon_service: 'heroku-postgresql', namespace: null}).returns(Promise.resolve(
        {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app, config_vars: ['DATABASE_URL']},
      ))
      api.get('/apps/myapp/config-vars').reply(200, {
        DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
      })
      return fetcher(new Heroku()).database('myapp', 'DATABASE_URL')
        .then(db => expect(db.user).to.equal('pguser'))
    })

    it('uses attachment db config', () => {
      let addonApp = {name: 'addon-app'}
      let attachApp = {name: 'attach-myapp'}
      stub.withArgs(sinon.match.any, 'myapp', 'attach-myapp::DATABASE_URL', {addon_service: 'heroku-postgresql', namespace: null}).returns(Promise.resolve(
        {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app: attachApp, config_vars: ['DATABASE_URL']},
      ))
      api.get('/apps/attach-myapp/config-vars').reply(200, {
        DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
      })
      return fetcher(new Heroku()).database('myapp', 'attach-myapp::DATABASE_URL')
        .then(db => expect(db.user).to.equal('pguser'))
    })

    it('returns db connection info when multiple but no ambiguity', () => {
      let addonApp = {name: 'addon-app'}
      let app = {name: 'myapp'}
      let err = Object.assign(new Error('error message'), {
        statusCode: 422,
        body: {id: 'multiple_matches'},
        matches: [
          {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app, config_vars: ['FOO_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app, config_vars: ['BAR_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app, namespace: 'credential:something', config_vars: ['CRED_URL']},
        ],
      })
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

      api.get('/apps/myapp/config-vars').reply(200, {
        FOO_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        BAR_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        CRED_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
      })

      return fetcher(new Heroku()).database('myapp', 'DATABASE_URL')
        .then(db => expect(db.user).to.equal('pguser'))
    })

    it('returns db connection for app::config info when multiple but no ambiguity', () => {
      let addonApp = {name: 'addon-app'}
      let attachApp = {name: 'attach-app'}
      let err = Object.assign(new Error('error message'), {
        statusCode: 422,
        body: {id: 'multiple_matches'},
        matches: [
          {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app: attachApp, config_vars: ['FOO_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app: attachApp, config_vars: ['BAR_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp, plan: {name: 'standard-0'}}, app: attachApp, namespace: 'credential:something', config_vars: ['CRED_URL']},
        ],
      })
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

      api.get('/apps/attach-app/config-vars').reply(200, {
        FOO_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        BAR_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        CRED_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
      })

      return fetcher(new Heroku()).database('myapp', 'DATABASE_URL')
        .then(db => expect(db.user).to.equal('pguser'))
    })

    it('errors when config var value ambiguity', () => {
      let addonApp = {name: 'addon-app'}
      let app = {name: 'myapp'}
      let err = {
        statusCode: 422,
        body: {id: 'multiple_matches'},
        matches: [
          {addon: {id: 100, name: 'postgres-1', app: addonApp}, app, config_vars: ['FOO_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp}, app, config_vars: ['BAR_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp}, app, namespace: 'credential:something', config_vars: ['CRED_URL']},
        ],
      }
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

      api.get('/apps/myapp/config-vars').reply(200, {
        FOO_URL: 'postgres://pguser:pgpass@pghost.com/pgdb1',
        BAR_URL: 'postgres://pguser:pgpass@pghost.com/pgdb2',
        CRED_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
      })

      return expect(fetcher(new Heroku()).database('myapp', 'DATABASE_URL')).to.be.rejectedWith(err)
    })

    it('errors when config addon ambiguity', () => {
      let addonApp = {name: 'addon-app'}
      let app = {name: 'myapp'}
      let err = {
        statusCode: 422,
        body: {id: 'multiple_matches'},
        matches: [
          {addon: {id: 100, name: 'postgres-1', app: addonApp}, app, config_vars: ['FOO_URL']},
          {addon: {id: 101, name: 'postgres-2', app: addonApp}, app, config_vars: ['BAR_URL']},
        ],
      }
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

      return expect(fetcher(new Heroku()).database('myapp', 'DATABASE_URL')).to.be.rejectedWith(err)
    })

    it('errors when config app ambiguity', () => {
      let addonApp = {name: 'addon-app'}
      let app = {name: 'myapp'}
      let err = {
        statusCode: 422,
        body: {id: 'multiple_matches'},
        matches: [
          {addon: {id: 100, name: 'postgres-1', app: app}, app: {id: 100}, config_vars: ['FOO_URL']},
          {addon: {id: 100, name: 'postgres-1', app: addonApp}, app: {id: 101}, config_vars: ['BAR_URL']},
        ],
      }
      stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

      return expect(fetcher(new Heroku()).database('myapp', 'DATABASE_URL')).to.be.rejectedWith(err)
    })

    describe('when not found and DATABASE_URL config var exists', () => {
      it('returns when no db arg', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}
        err.message = 'Not Found'

        stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

        api.get('/apps/myapp/config-vars').reply(200, {
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
          HEROKU_POSTGRESQL_PINK_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        })

        let plan = {name: 'heroku-postgresql:hobby-dev'}
        let attachments = [
          {
            app: {name: 'myapp'},
            addon: {id: 100, name: 'postgres-1', plan},
            config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
          },
        ]

        api.get('/apps/myapp/addon-attachments').reply(200, attachments)

        return fetcher(new Heroku()).database('myapp')
          .then(db => expect(db).to.deep.equal({
            user: 'pguser',
            password: 'pgpass',
            database: 'pgdb',
            host: 'pghost.com',
            port: 5432,
            attachment: attachments[0],
            url: util.parsePostgresConnectionString('postgres://pguser:pgpass@pghost.com/pgdb'),
          }))
      })

      it('returns when DATABASE_URL db arg', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}
        err.message = 'Not Found'

        stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

        api.get('/apps/myapp/config-vars').reply(200, {
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
          HEROKU_POSTGRESQL_PINK_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        })

        let plan = {name: 'heroku-postgresql:hobby-dev'}
        let attachments = [
          {
            app: {name: 'myapp'},
            addon: {id: 100, name: 'postgres-1', plan},
            config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
          },
        ]

        api.get('/apps/myapp/addon-attachments').reply(200, attachments)

        return fetcher(new Heroku()).database('myapp', 'DATABASE_URL')
          .then(db => expect(db).to.deep.equal({
            user: 'pguser',
            password: 'pgpass',
            database: 'pgdb',
            host: 'pghost.com',
            port: 5432,
            attachment: attachments[0],
            url: util.parsePostgresConnectionString('postgres://pguser:pgpass@pghost.com/pgdb'),
          }))
      })

      it('returns when attach-app::DATABASE_URL db arg', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}
        err.message = 'Not Found'

        stub.withArgs(sinon.match.any, 'myapp', 'attach-app::DATABASE_URL').returns(Promise.reject(err))

        api.get('/apps/attach-app/config-vars').reply(200, {
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
          HEROKU_POSTGRESQL_PINK_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        })

        let plan = {name: 'heroku-postgresql:hobby-dev'}
        let attachments = [
          {
            app: {name: 'attach-app'},
            addon: {id: 100, name: 'postgres-1', plan},
            config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
          },
        ]

        api.get('/apps/attach-app/addon-attachments').reply(200, attachments)

        return fetcher(new Heroku()).database('myapp', 'attach-app::DATABASE_URL')
          .then(db => expect(db).to.deep.equal({
            user: 'pguser',
            password: 'pgpass',
            database: 'pgdb',
            host: 'pghost.com',
            port: 5432,
            attachment: attachments[0],
            url: util.parsePostgresConnectionString('postgres://pguser:pgpass@pghost.com/pgdb'),
          }))
      })

      it('returns when DATABASE db arg', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}
        err.message = 'Not Found'

        stub.withArgs(sinon.match.any, 'myapp', 'DATABASE').returns(Promise.reject(err))

        api.get('/apps/myapp/config-vars').reply(200, {
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
          HEROKU_POSTGRESQL_PINK_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        })

        let plan = {name: 'heroku-postgresql:hobby-dev'}
        let attachments = [
          {
            app: {name: 'myapp'},
            addon: {id: 100, name: 'postgres-1', plan},
            config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
          },
        ]

        api.get('/apps/myapp/addon-attachments').reply(200, attachments)

        return fetcher(new Heroku()).database('myapp', 'DATABASE')
          .then(db => expect(db).to.deep.equal({
            user: 'pguser',
            password: 'pgpass',
            database: 'pgdb',
            host: 'pghost.com',
            port: 5432,
            attachment: attachments[0],
            url: util.parsePostgresConnectionString('postgres://pguser:pgpass@pghost.com/pgdb'),
          }))
      })

      it('throws not found if not neither set', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}

        stub.withArgs(sinon.match.any, 'myapp', 'FOOBAR_URL').returns(Promise.reject(err))

        api.get('/apps/myapp/config-vars').reply(200, {
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb',
        })

        let plan = {name: 'heroku-postgresql:hobby-dev'}
        let attachments = [
          {
            app: {name: 'myapp'},
            addon: {id: 100, name: 'postgres-1', plan},
            config_vars: ['HEROKU_POSTGRESQL_PINK_URL'],
          },
        ]

        api.get('/apps/myapp/addon-attachments').reply(200, attachments)

        return expect(fetcher(new Heroku()).database('myapp', 'FOOBAR_URL')).to.be.rejectedWith(/Unknown database: FOOBAR_URL. Valid options are: HEROKU_POSTGRESQL_PINK_URL/)
      })

      it('throws not found if mismatch', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}

        stub.withArgs(sinon.match.any, 'myapp', 'FOOBAR_URL').returns(Promise.reject(err))

        api.get('/apps/myapp/config-vars').reply(200, {
          FOOBAR_URL: 'postgres://pguser:pgpass@pghost.com/pgdb1',
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb2',
        })

        let plan = {name: 'heroku-postgresql:hobby-dev'}
        let attachments = [
          {
            app: {name: 'myapp'},
            addon: {id: 100, name: 'postgres-1', plan},
            config_vars: ['DATABASE_URL'],
          },
        ]

        api.get('/apps/myapp/addon-attachments').reply(200, attachments)

        return expect(fetcher(new Heroku()).database('myapp', 'FOOBAR_URL')).to.be.rejectedWith(/Unknown database: FOOBAR_URL. Valid options are: DATABASE_URL/)
      })

      it('throws an error if no databases', () => {
        const err = new Error('error message')
        err.statusCode = 404
        err.body = {id: 'not_found'}

        stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').returns(Promise.reject(err))

        api.get('/apps/myapp/config-vars').reply(200, {
          DATABASE_URL: 'postgres://pguser:pgpass@pghost.com/pgdb2',
        })

        api.get('/apps/myapp/addon-attachments').reply(200, [])

        return expect(fetcher(new Heroku()).database('myapp')).to.be.rejectedWith(/myapp has no databases/)
      })
    })

    describe('when not found and DATABASE_URL config var does not exist', () => {
      it('throws not found if mismatch', () => {
        const err = new Error('error message')
        err.statusCode = 404

        stub.withArgs(sinon.match.any, 'myapp', 'DATABASE_URL').throws(err)

        return expect(fetcher(new Heroku()).database('myapp')).to.be.rejectedWith(err)
      })
    })
  })

  describe('all', () => {
    it('returns all addons attached to app', () => {
      let plan = {name: 'heroku-postgresql:hobby-dev'}
      let attachments = [
        {addon: {id: 100, name: 'postgres-1', plan}, name: 'DATABASE'},
        {addon: {id: 100, name: 'postgres-1', plan}, name: 'HEROKU_POSTGRESQL_PINK'},
        {addon: {id: 101, name: 'postgres-2', plan}, name: 'HEROKU_POSTGRESQL_BRONZE'},
      ]
      api.get('/apps/myapp/addon-attachments').reply(200, attachments)

      return fetcher(new Heroku()).all('myapp')
        .then(addons => {
          expect(addons[0], 'to satisfy', {name: 'postgres-1'})
          expect(addons[1], 'to satisfy', {name: 'postgres-2'})
          expect(addons[0], 'to satisfy', {attachment_names: ['DATABASE', 'HEROKU_POSTGRESQL_PINK']})
          expect(addons.length).to.equal(2)
        })
    })
  })
})
