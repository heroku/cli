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
  })
})
