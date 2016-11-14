'use strict'
/* globals describe beforeEach afterEach cli it nock */

let resolve = require('../../lib/resolve')
let expect = require('unexpected')
let Heroku = require('heroku-client')

describe('resolve', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  describe('addon', () => {
    it('finds a single matching addon', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/addons/myaddon-1').reply(200, {name: 'myaddon-1'})

      return resolve.addon(new Heroku(), null, 'myaddon-1')
        .then((addon) => expect(addon, 'to satisfy', {name: 'myaddon-1'}))
        .then(() => api.done())
    })

    it('finds a single matching addon for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/myaddon-2').reply(200, {name: 'myaddon-2'})

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-2')
        .then((addon) => expect(addon, 'to satisfy', {name: 'myaddon-2'}))
        .then(() => api.done())
    })

    it('fails if no addon found', () => {
      nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/myaddon-3').reply(404)
        .get('/addons/myaddon-3').reply(404)

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-3')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {statusCode: 404}))
    })

    it('fails if errored', () => {
      nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/myaddon-5').reply(401)

      return resolve.addon(new Heroku(), 'myapp', 'myaddon-5')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {statusCode: 401}))
    })

    describe('memoization', () => {
      it('memoizes an addon for an app', () => {
        let api = nock('https://api.heroku.com:443')
          .get('/apps/myapp/addons/myaddon-6').reply(200, {name: 'myaddon-6'})

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
              .get('/apps/myapp/addons/myaddon-7').reply(200, {name: 'myaddon-7'})

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-7')
              .then(function (diffIdAddon) {
                expect(diffIdAddon, 'to satisfy', {name: 'myaddon-7'})
                diffId.done()
              })
          })
          .then(function () {
            let diffApp = nock('https://api.heroku.com:443')
              .get('/apps/fooapp/addons/myaddon-6').reply(200, {name: 'myaddon-6'})

            return resolve.addon(new Heroku(), 'fooapp', 'myaddon-6')
              .then(function (diffAppAddon) {
                expect(diffAppAddon, 'to satisfy', {name: 'myaddon-6'})
                diffApp.done()
              })
          })
      })

      it('does not memoize errors', () => {
        let api = nock('https://api.heroku.com:443')
          .get('/apps/myapp/addons/myaddon-8').reply(403, {id: 'two_factor'})

        return resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
          .then(() => { throw new Error('unreachable') })
          .catch((err) => expect(err.body, 'to satisfy', {id: 'two_factor'}))
          .then(() => api.done())
          .then(function () {
            nock.cleanAll()

            let apiRetry = nock('https://api.heroku.com:443')
              .get('/apps/myapp/addons/myaddon-8').reply(200, {name: 'myaddon-8'})

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
              .then((addon) => expect(addon, 'to satisfy', {name: 'myaddon-8'}))
              .then(() => apiRetry.done())
          })
          .then(function () {
            nock.cleanAll()

            return resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
              .then((addon) => expect(addon, 'to satisfy', {name: 'myaddon-8'}))
          })
      })
    })
  })

  describe('attachment', () => {
    it('finds a single matching attachment', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/addon-attachments/myattachment').reply(200, {name: 'myattachment'})

      return resolve.attachment(new Heroku(), null, 'myattachment')
        .then((addon) => expect(addon, 'to satisfy', {name: 'myattachment'}))
        .then(() => api.done())
    })

    it('finds a single matching attachment for an app', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addon-attachments/myattachment-1').reply(200, {name: 'myattachment-1'})

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-1')
        .then((addon) => expect(addon, 'to satisfy', {name: 'myattachment-1'}))
        .then(() => api.done())
    })

    it('passes on errors getting attachment', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/addon-attachments/myattachment').reply(401)

      return resolve.attachment(new Heroku(), null, 'myattachment')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {statusCode: 401}))
        .then(() => api.done())
    })

    it('passes on errors getting app/attachment', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addon-attachments/myattachment-2').reply(401)

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-2')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {statusCode: 401}))
        .then(() => api.done())
    })

    it('falls back to searching by addon', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addon-attachments/myattachment-3').reply(404)

      let appAddon = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/myattachment-3').reply(200, {id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3'})

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'myapp'}, name: 'some-random-name'}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-3')
        .then((addon) => expect(addon, 'to satisfy', {name: 'some-random-name'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('throws an error when not found', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addon-attachments/myattachment-4').reply(404)

      let appAddon = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/myattachment-4').reply(200, {id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-4'})

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{app: {name: 'not-myapp'}, name: 'some-random-name'}])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-4')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {message: 'Couldn\'t find that addon.'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })

    it('does not fallback and throws error when there is no app', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/addon-attachments/myattachment-4').reply(404)

      return resolve.attachment(new Heroku(), null, 'myattachment-4')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {message: 'Couldn\'t find that addon.'}))
        .then(() => api.done())
    })

    it('throws an error when ambiguous', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addon-attachments/myattachment-5').reply(404)

      let appAddon = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/myattachment-5').reply(200, {id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-5'})

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [
          {app: {name: 'myapp'}, name: 'some-random-name-1'},
          {app: {name: 'myapp'}, name: 'some-random-name-2'}
        ])

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment-5')
        .then(() => { throw new Error('unreachable') })
        .catch((err) => expect(err, 'to satisfy', {message: 'Ambiguous identifier; multiple matching add-ons found: some-random-name-1, some-random-name-2.'}))
        .then(() => api.done())
        .then(() => appAddon.done())
        .then(() => appAttachment.done())
    })
  })
})
