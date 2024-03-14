'use strict'
/* globals beforeEach afterEach cli nock */

let resolve = require('../../../lib/resolve')
const {expect} = require('chai')
let Heroku = require('heroku-client')

describe('resolve', () => {
  beforeEach(function () {
    cli.mockConsole()
    resolve.addon.cache.clear()
  })

  afterEach(() => nock.cleanAll())

  describe('addon', () => {
    it('finds a single matching addon', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-1'}).reply(200, [{name: 'myaddon-1'}])

      return resolve.addon(new Heroku(), null, 'myaddon-1')
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds a single matching addon for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-2'}).reply(200, [{name: 'myaddon-2'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-2')
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-2'}))
        .then(() => api.done())
    })

    it('fails if no addon found', () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3'}).reply(404, {resource: 'add_on'})
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-3'}).reply(404, {resource: 'add_on'})

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-3')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404}))
    })

    it('fails if no addon found with addon-service', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404}))
        .then(() => api.done())
    })

    it('fails if errored', () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'}).reply(401)

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 401}))
    })

    it('fails if ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'})
        .reply(200, [{name: 'myaddon-5'}, {name: 'myaddon-6'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(function (error) {
          api.done()
          expect(error, 'to satisfy', {message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon'})
        })
    })

    it('fails if no addon found', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})
        .post('/actions/addons/resolve', {app: null, addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on'})

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404}))
        .then(() => {
          api.done()
        })
    })

    it('fails if app not found', () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-3', addon_service: 'slowdb'}).reply(404, {resource: 'app'})

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404, body: {resource: 'app'}}))
        .then(() => {
          api.done()
        })
    })

    it('finds the addon with null namespace for an app if no namespace is specified', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1', namespace: null}, {name: 'myaddon-1b', namespace: 'definitely-not-null'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-1')
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds the addon with no namespace for an app if no namespace is specified', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1'}, {name: 'myaddon-1b', namespace: 'definitely-not-null'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-1')
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds the addon with the specified namespace for an app if there are multiple addons', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1'}, {name: 'myaddon-1b', namespace: 'great-namespace'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-1', {namespace: 'great-namespace'})
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-1b'}))
        .then(() => api.done())
    })

    it('finds the addon with the specified namespace for an app if there is only one addon', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1b', namespace: 'great-namespace'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-1', {namespace: 'great-namespace'})
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-1b'}))
        .then(() => api.done())
    })

    it('fails if there is no addon with the specified namespace for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-1', {namespace: 'amazing-namespace'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404}))
        .then(() => {
          api.done()
        })
    })

    it('finds the addon with a namespace for an app if there is only match which happens to have a namespace', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-1'})
        .reply(200, [{name: 'myaddon-1', namespace: 'definitely-not-null'}])

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-1')
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-1'}))
        .then(() => api.done())
    })

    describe('memoization', () => {
      it('memoizes an addon for an app', () => {
        let api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-6'}).reply(200, [{name: 'myaddon-6'}])

        return resolve.addon(new Heroku(), 'myapp', 'myaddon-6')
          .then(function (addon) {
            expect(addon, 'to satisfy', {name: 'myaddon-6'})
            api.done()
          })
          .then(function () {
            nock.cleanAll()

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-6')
              .then(function (memoizedAddon) {
                expect(memoizedAddon, 'to satisfy', {name: 'myaddon-6'})
              })
          })
          .then(function () {
            let diffId = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-7'}).reply(200, [{name: 'myaddon-7'}])

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-7')
              .then(function (diffIdAddon) {
                expect(diffIdAddon, 'to satisfy', {name: 'myaddon-7'})
                diffId.done()
              })
          })
          .then(function () {
            let diffApp = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'fooapp', addon: 'myaddon-6'}).reply(200, [{name: 'myaddon-6'}])

            return resolve.addon(new Heroku(), 'fooapp', 'myaddon-6')
              .then(function (diffAppAddon) {
                expect(diffAppAddon, 'to satisfy', {name: 'myaddon-6'})
                diffApp.done()
              })
          })
          .then(function () {
            let diffAddonService = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'fooapp', addon: 'myaddon-6', addon_service: 'slowdb'}).reply(200, [{name: 'myaddon-6'}])

            return resolve.addon(new Heroku(), 'fooapp', 'myaddon-6', {addon_service: 'slowdb'})
              .then(function (diffAddonServiceAddon) {
                expect(diffAddonServiceAddon, 'to satisfy', {name: 'myaddon-6'})
                diffAddonService.done()
              })
          })
      })

      it('does not memoize errors', () => {
        let api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-8'}).reply(403, {id: 'two_factor'})

        return resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
          .then(() => {
            throw new Error('unreachable')
          })
          .catch(error => expect(error.body, 'to satisfy', {id: 'two_factor'}))
          .then(() => api.done())
          .then(function () {
            nock.cleanAll()

            let apiRetry = nock('https://api.heroku.com:443')
              .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-8'}).reply(200, [{name: 'myaddon-8'}])

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
              .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-8'}))
              .then(() => apiRetry.done())
          })
          .then(function () {
            nock.cleanAll()

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
              .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-8'}))
          })
      })
    })
  })

  describe('attachment', () => {
    it('finds a single matching attachment', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: null, addon_attachment: 'myattachment'}).reply(200, [{name: 'myattachment'}])

      return resolve.attachment(new Heroku(), null, 'myattachment')
        .then(addon => expect(addon, 'to satisfy', {name: 'myattachment'}))
        .then(() => api.done())
    })

    it('finds a single matching attachment for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-1'}).reply(200, [{name: 'myattachment-1'}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-1')
        .then(addon => expect(addon, 'to satisfy', {name: 'myattachment-1'}))
        .then(() => api.done())
    })

    it('passes on errors getting attachment', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: null, addon_attachment: 'myattachment'}).reply(401)

      return resolve.attachment(new Heroku(), null, 'myattachment')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 401}))
        .then(() => api.done())
    })

    it('passes on errors getting app/attachment', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-2'}).reply(401)

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-2')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 401}))
        .then(() => api.done())
    })

    it('falls back to searching by addon', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-3'}).reply(404, {resource: 'add_on attachment'})

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-3'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'myapp'}, name: 'some-random-name'}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3')
        .then(addon => expect(addon, 'to satisfy', {name: 'some-random-name'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('falls back to searching by addon and addon_service', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on attachment'})

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-3', addon_service: 'slowdb'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'myapp'}, name: 'some-random-name', addon_service: {name: 'slowdb'}}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', {addon_service: 'slowdb'})
        .then(addon => expect(addon, 'to satisfy', {name: 'some-random-name'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('falls back to searching by addon and addon_service when ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-3', addon_service: 'slowdb'}).reply(200, [
          {app: {name: 'myapp'}, name: 'some-random-name-1'},
          {app: {name: 'myapp'}, name: 'some-random-name-2'},
        ])

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-3', addon_service: 'slowdb'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'myapp'}, name: 'some-random-name', addon_service: {name: 'slowdb'}}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', {addon_service: 'slowdb'})
        .then(addon => expect(addon, 'to satisfy', {name: 'some-random-name'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('throws original error when ambiguous and searching by addon and addon_service is ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-3', addon_service: 'slowdb'}).reply(200, [
          {app: {name: 'myapp'}, name: 'some-random-name-1'},
          {app: {name: 'myapp'}, name: 'some-random-name-2'},
        ])

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-3', addon_service: 'slowdb'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [
          {app: {name: 'myapp'}, name: 'some-random-name-a', addon_service: {name: 'slowdb'}},
          {app: {name: 'myapp'}, name: 'some-random-name-b', addon_service: {name: 'slowdb'}},
        ])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(function (error) {
          api.done()
          appAddon.done()
          appAttachment.done()
          expect(error, 'to satisfy', {message: 'Ambiguous identifier; multiple matching add-ons found: some-random-name-1, some-random-name-2.', type: 'addon_attachment'})
        })
    })

    it('falls back to searching by addon and ignores addon_service if not passed', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-3'}).reply(404)

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-3'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'myapp'}, name: 'some-random-name', addon_service: {name: 'slowdb'}}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3')
        .then(addon => expect(addon, 'to satisfy', {name: 'some-random-name'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('throws an error when not found', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-4'}).reply(404, {resource: 'add_on attachment'})

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-4'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-4'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'not-myapp'}, name: 'some-random-name'}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-4')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {message: 'Couldn\'t find that addon.'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('throws an error when app not found', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-4'}).reply(404, {resource: 'app'})

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-4'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-4'}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-4')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {body: {resource: 'app'}}))
        .then(() => api.done())
        .then(() => appAddon.done())
    })

    it('throws an error when not found with addon_service', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-3', addon_service: 'slowdb'}).reply(404, {resource: 'add_on attachment'})

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-3', addon_service: 'slowdb'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'myapp'}, name: 'some-random-name', addon_service: {name: 'not-slowdb'}}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', {addon_service: 'slowdb'})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {message: 'Couldn\'t find that addon.'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('does not fallback and throws error when there is no app', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: null, addon_attachment: 'myattachment-4'}).reply(404, {resource: 'add_on attachment'})

      return resolve.attachment(new Heroku(), null, 'myattachment-4')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {message: 'Couldn\'t find that addon.'}))
        .then(() => api.done())
    })

    it('throws an error when ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-5'}).reply(404, {resource: 'add_on attachment'})

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myattachment-5'}).reply(200, [{id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-5'}])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [
          {app: {name: 'myapp'}, name: 'some-random-name-1'},
          {app: {name: 'myapp'}, name: 'some-random-name-2'},
        ])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {message: 'Ambiguous identifier; multiple matching add-ons found: some-random-name-1, some-random-name-2.', type: 'addon_attachment'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })
  })

  describe('appAddon', () => {
    it('finds a single matching addon for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-2'}).reply(200, [{name: 'myaddon-2'}])

      return resolve.appAddon(new Heroku(), 'myapp', 'myaddon-2')
        .then(addon => expect(addon, 'to satisfy', {name: 'myaddon-2'}))
        .then(() => api.done())
    })

    it('fails if not found', () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'}).reply(404)

      return resolve.appAddon(new Heroku(), 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404}))
    })

    it('fails if ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'myaddon-5'})
        .reply(200, [{name: 'myaddon-5'}, {name: 'myaddon-6'}])

      return resolve.appAddon(new Heroku(), 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(function (error) {
          api.done()
          expect(error, 'to satisfy', {message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon'})
        })
    })
  })

  describe('appAttachment', () => {
    it('finds a single matching attachment for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myattachment-1'}).reply(200, [{name: 'myattachment-1'}])

      return resolve.appAttachment(new Heroku(), 'myapp', 'myattachment-1')
        .then(addon => expect(addon, 'to satisfy', {name: 'myattachment-1'}))
        .then(() => api.done())
    })

    it('fails if not found', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: null, addon_attachment: 'myattachment'}).reply(404)

      return resolve.appAttachment(new Heroku(), null, 'myattachment')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {statusCode: 404}))
        .then(() => api.done())
    })

    it('fails if ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'myaddon-5'})
        .reply(200, [{name: 'myaddon-5'}, {name: 'myaddon-6'}])

      return resolve.appAttachment(new Heroku(), 'myapp', 'myaddon-5')
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(function (error) {
          expect(error, 'to satisfy', {message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon_attachment'})
          api.done()
        })
    })
  })
})
