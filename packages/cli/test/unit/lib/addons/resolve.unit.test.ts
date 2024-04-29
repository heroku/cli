'use strict'

import {resolveAddon, appAddon} from '../../../../src/lib/addons/resolve'
import {getHerokuAPI} from '../../../helpers/testInstances'
const {expect} = require('chai')
import * as nock from 'nock'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'

describe('resolve', () => {
  let herokuAPI: APIClient

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolveAddon.cache.clear()
    herokuAPI = await getHerokuAPI()
  })

  afterEach(() => nock.cleanAll())

  describe('addon', () => {
    it('finds a single matching addon', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-1'}).reply(200, [{name: 'myaddon-1'}])

      return resolveAddon(herokuAPI, undefined, 'myaddon-1')
        .then((addon: Heroku.AddOn) => expect(addon).to.deep.equal({name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds a single matching addon for an app', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-2'}).reply(200, [{name: 'myaddon-2'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-2')
        .then((addon: Heroku.AddOn) => expect(addon).to.deep.equal({name: 'myaddon-2'}))
        .then(() => api.done())
    })

    it('fails if no addon found', () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3'}).reply(404, {resource: 'add_on'})
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-3'}).reply(404, {resource: 'add_on'})

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-3')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => expect(error).to.have.nested.include({statusCode: 404}))
    })

    it('fails if no addon found with addon-service', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => expect(error).to.have.nested.include({statusCode: 404}))
        .then(() => api.done())
    })

    it('fails if errored', () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'}).reply(401)

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => expect(error).to.have.nested.include({statusCode: 401}))
    })

    it('fails if ambiguous', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'})
        .reply(200, [{name: 'myaddon-5'}, {name: 'myaddon-6'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(function (error: any) {
          api.done()
          expect(error).to.have.nested.include({message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon'})
        })
    })

    it('fails if no addon found', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => expect(error).to.have.nested.include({statusCode: 404}))
        .then(() => {
          api.done()
        })
    })

    it('fails if app not found', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'app'})

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => {
          expect(error).to.have.nested.include({statusCode: 404})
          expect(error.body).to.have.nested.include({resource: 'app'})
        })
        .then(() => {
          api.done()
        })
    })

    it('finds the addon with null namespace for an app if no namespace is specified', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1', namespace: null}, {name: 'myaddon-1b', namespace: 'definitely-not-null'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-1')
        .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds the addon with no namespace for an app if no namespace is specified', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1'}, {name: 'myaddon-1b', namespace: 'definitely-not-null'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-1')
        .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds the addon with the specified namespace for an app if there are multiple addons', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1'}, {name: 'myaddon-1b', namespace: 'great-namespace'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-1', {namespace: 'great-namespace'})
        .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-1b'}))
        .then(() => api.done())
    })

    it('finds the addon with the specified namespace for an app if there is only one addon', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1b', namespace: 'great-namespace'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-1', {namespace: 'great-namespace'})
        .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-1b'}))
        .then(() => api.done())
    })

    it('fails if there is no addon with the specified namespace for an app', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-1', {namespace: 'amazing-namespace'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => expect(error).to.have.nested.include({statusCode: 404}))
        .then(() => {
          api.done()
        })
    })

    it('finds the addon with a namespace for an app if there is only match which happens to have a namespace', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1', namespace: 'definitely-not-null'}])

      return resolveAddon(herokuAPI, 'myapp', 'myaddon-1')
        .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-1'}))
        .then(() => api.done())
    })

    describe('memoization', () => {
      it('memoizes an addon for an app', () => {
        const api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-6'}).reply(200, [{name: 'myaddon-6'}])

        return resolveAddon(herokuAPI, 'myapp', 'myaddon-6')
          .then(function (addon: Heroku.AddOn) {
            expect(addon).to.have.nested.include({name: 'myaddon-6'})
            api.done()
          })
          .then(function () {
            nock.cleanAll()

            return resolveAddon(herokuAPI, 'myapp', 'myaddon-6')
              .then(function (memoizedAddon: Heroku.AddOn) {
                expect(memoizedAddon).to.have.nested.include({name: 'myaddon-6'})
              })
          })
          .then(function () {
            const diffId = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-7'}).reply(200, [{name: 'myaddon-7'}])

            return resolveAddon(herokuAPI, 'myapp', 'myaddon-7')
              .then(function (diffIdAddon: Heroku.AddOn) {
                expect(diffIdAddon).to.have.nested.include({name: 'myaddon-7'})
                diffId.done()
              })
          })
          .then(function () {
            const diffApp = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'fooapp', addon: 'myaddon-6'}).reply(200, [{name: 'myaddon-6'}])

            return resolveAddon(herokuAPI, 'fooapp', 'myaddon-6')
              .then(function (diffAppAddon: Heroku.AddOn) {
                expect(diffAppAddon).to.have.nested.include({name: 'myaddon-6'})
                diffApp.done()
              })
          })
          .then(function () {
            const diffAddonService = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'fooapp', addon: 'myaddon-6', addon_service: 'slowdb'}).reply(200, [{name: 'myaddon-6'}])

            return resolveAddon(herokuAPI, 'fooapp', 'myaddon-6', {addon_service: 'slowdb'})
              .then(function (diffAddonServiceAddon: Heroku.AddOn) {
                expect(diffAddonServiceAddon).to.have.nested.include({name: 'myaddon-6'})
                diffAddonService.done()
              })
          })
      })

      it('does not memoize errors', () => {
        const api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-8'}).reply(500, {id: 'internal server error'})

        return resolveAddon(herokuAPI, 'myapp', 'myaddon-8')
          .then(() => {
            throw new Error('unreachable')
          })
          .catch((error: any) => {
            expect(error.body).to.have.nested.include({id: 'internal server error'})
          })
          .then(() => api.done())
          .then(function () {
            nock.cleanAll()

            const apiRetry = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-8'}).reply(200, [{name: 'myaddon-8'}])

            return resolveAddon(herokuAPI, 'myapp', 'myaddon-8')
              .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-8'}))
              .then(() => apiRetry.done())
          })
          .then(function () {
            nock.cleanAll()

            return resolveAddon(herokuAPI, 'myapp', 'myaddon-8')
              .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-8'}))
          })
      })
    })
  })

  describe('appAddon', () => {
    it('finds a single matching addon for an app', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-2'}).reply(200, [{name: 'myaddon-2'}])

      return appAddon(herokuAPI, 'myapp', 'myaddon-2')
        .then((addon: Heroku.AddOn) => expect(addon).to.have.nested.include({name: 'myaddon-2'}))
        .then(() => api.done())
    })

    it('fails if not found', () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'}).reply(404)

      return appAddon(herokuAPI, 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch((error: any) => expect(error).to.have.nested.include({statusCode: 404}))
    })

    it('fails if ambiguous', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'})
        .reply(200, [{name: 'myaddon-5'}, {name: 'myaddon-6'}])

      return appAddon(herokuAPI, 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(function (error: any) {
          api.done()
          expect(error).to.have.nested.include({message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon'})
        })
    })
  })
})
