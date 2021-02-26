'use strict'
/* globals describe beforeEach afterEach cli it nock */

let resolve = require('../../lib/resolve')
const { expect } = require('chai')
let Heroku = require('heroku-client')

describe('resolve', () => {
  beforeEach(function () {
    cli.mockConsole()
    resolve.addon.cache.clear()
  })

  afterEach(() => nock.cleanAll())

  describe('addon', () => {
    it('finds a single matching addon', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': null, 'addon': 'myaddon-1' }).reply(200, [{ name: 'myaddon-1' }])

      await resolve.addon(new Heroku(), null, 'myaddon-1')

      expect(addon, 'to satisfy', { name: 'myaddon-1' });

      return api.done()
    })

    it('finds a single matching addon for an app', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-2' }).reply(200, [{ name: 'myaddon-2' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-2')

      expect(addon, 'to satisfy', { name: 'myaddon-2' });

      return api.done()
    })

    it('fails if no addon found', async () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-3' }).reply(404, { 'resource': 'add_on' })
        .post('/actions/addons/resolve', { 'app': null, 'addon': 'myaddon-3' }).reply(404, { 'resource': 'add_on' })

      try {
        await resolve.addon(new Heroku(), 'myapp', 'myaddon-3')
        throw new Error('unreachable')
      } catch (err) {
        return expect(err, 'to satisfy', { statusCode: 404 })
      }
    })

    it('fails if no addon found with addon-service', async () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'add_on' })
        .post('/actions/addons/resolve', { 'app': null, 'addon': 'myaddon-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'add_on' })

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-3', { 'addon_service': 'slowdb' })
        .catch((err) => expect(err, 'to satisfy', { statusCode: 404 }))

      throw new Error('unreachable')

      return api.done()
    })

    it('fails if errored', async () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-5' }).reply(401)

      try {
        await resolve.addon(new Heroku(), 'myapp', 'myaddon-5')
        throw new Error('unreachable')
      } catch (err) {
        return expect(err, 'to satisfy', { statusCode: 401 })
      }
    })

    it('fails if ambiguous', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-5' })
        .reply(200, [{ 'name': 'myaddon-5' }, { 'name': 'myaddon-6' }])

      try {
        await resolve.addon(new Heroku(), 'myapp', 'myaddon-5')
        throw new Error('unreachable')
      } catch (err) {
        api.done()
        expect(err, 'to satisfy', { message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon' })
      }
    })

    it('fails if no addon found', async () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'add_on' })
        .post('/actions/addons/resolve', { 'app': null, 'addon': 'myaddon-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'add_on' })

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-3', { 'addon_service': 'slowdb' })
        .catch((err) => expect(err, 'to satisfy', { statusCode: 404 }))

      throw new Error('unreachable')

      api.done()
    })

    it('fails if app not found', async () => {
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'app' })

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-3', { 'addon_service': 'slowdb' })
        .catch((err) => expect(err, 'to satisfy', { statusCode: 404, body: { 'resource': 'app' } }))

      throw new Error('unreachable')

      api.done()
    })

    it('finds the addon with null namespace for an app if no namespace is specified', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-1' })
        .reply(200, [{ 'name': 'myaddon-1', 'namespace': null }, { 'name': 'myaddon-1b', 'namespace': 'definitely-not-null' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-1')

      expect(addon, 'to satisfy', { name: 'myaddon-1' });

      return api.done()
    })

    it('finds the addon with no namespace for an app if no namespace is specified', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-1' })
        .reply(200, [{ 'name': 'myaddon-1' }, { 'name': 'myaddon-1b', 'namespace': 'definitely-not-null' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-1')

      expect(addon, 'to satisfy', { name: 'myaddon-1' });

      return api.done()
    })

    it('finds the addon with the specified namespace for an app if there are multiple addons', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-1' })
        .reply(200, [{ 'name': 'myaddon-1' }, { 'name': 'myaddon-1b', 'namespace': 'great-namespace' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-1', { namespace: 'great-namespace' })

      expect(addon, 'to satisfy', { name: 'myaddon-1b' });

      return api.done()
    })

    it('finds the addon with the specified namespace for an app if there is only one addon', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-1' })
        .reply(200, [{ 'name': 'myaddon-1b', 'namespace': 'great-namespace' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-1', { namespace: 'great-namespace' })

      expect(addon, 'to satisfy', { name: 'myaddon-1b' });

      return api.done()
    })

    it('fails if there is no addon with the specified namespace for an app', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-1' })
        .reply(200, [{ 'name': 'myaddon-1' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-1', { 'namespace': 'amazing-namespace' })
        .catch((err) => expect(err, 'to satisfy', { statusCode: 404 }))

      throw new Error('unreachable')

      api.done()
    })

    it('finds the addon with a namespace for an app if there is only match which happens to have a namespace', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-1' })
        .reply(200, [{ 'name': 'myaddon-1', 'namespace': 'definitely-not-null' }])

      await resolve.addon(new Heroku(), 'myapp', 'myaddon-1')

      expect(addon, 'to satisfy', { name: 'myaddon-1' });

      return api.done()
    })

    describe('memoization', () => {
      it('memoizes an addon for an app', async () => {
        let api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-6' }).reply(200, [{ name: 'myaddon-6' }])

        await resolve.addon(new Heroku(), 'myapp', 'myaddon-6')

        api.done()
        expect(addon, 'to satisfy', { name: 'myaddon-6' })
        expect(memoizedAddon, 'to satisfy', { name: 'myaddon-6' })

        const memoizedAddon = await resolve.addon(new Heroku(), 'myapp', 'myaddon-6')
        nock.cleanAll()

        diffId.done()
        expect(diffIdAddon, 'to satisfy', { name: 'myaddon-7' })

        const diffIdAddon = await resolve.addon(new Heroku(), 'myapp', 'myaddon-7')
        let diffId = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-7' }).reply(200, [{ name: 'myaddon-7' }])

        diffApp.done()
        expect(diffAppAddon, 'to satisfy', { name: 'myaddon-6' })

        const diffAppAddon = await resolve.addon(new Heroku(), 'fooapp', 'myaddon-6')
        let diffApp = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', { 'app': 'fooapp', 'addon': 'myaddon-6' }).reply(200, [{ name: 'myaddon-6' }])

        let diffAddonService = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', { 'app': 'fooapp', 'addon': 'myaddon-6', 'addon_service': 'slowdb' }).reply(200, [{ name: 'myaddon-6' }])

        const diffAddonServiceAddon = await resolve.addon(new Heroku(), 'fooapp', 'myaddon-6', { 'addon_service': 'slowdb' })
        expect(diffAddonServiceAddon, 'to satisfy', { name: 'myaddon-6' })
        diffAddonService.done()
      })

      it('does not memoize errors', async () => {
        let api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-8' }).reply(403, { id: 'two_factor' })

        await resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
          .catch((err) => expect(err.body, 'to satisfy', { id: 'two_factor' }))

        throw new Error('unreachable')
        api.done();

        return apiRetry.done()

        await resolve.addon(new Heroku(), 'myapp', 'myaddon-8')

        let apiRetry = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-8' }).reply(200, [{ name: 'myaddon-8' }])

        nock.cleanAll()

        nock.cleanAll()

        const addon = await resolve.addon(new Heroku(), 'myapp', 'myaddon-8')
        return expect(addon, 'to satisfy', { name: 'myaddon-8' })
      })
    })
  })

  describe('attachment', () => {
    it('finds a single matching attachment', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': null, 'addon_attachment': 'myattachment' }).reply(200, [{ name: 'myattachment' }])

      await resolve.attachment(new Heroku(), null, 'myattachment')

      expect(addon, 'to satisfy', { name: 'myattachment' });

      return api.done()
    })

    it('finds a single matching attachment for an app', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-1' }).reply(200, [{ name: 'myattachment-1' }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-1')

      expect(addon, 'to satisfy', { name: 'myattachment-1' });

      return api.done()
    })

    it('passes on errors getting attachment', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': null, 'addon_attachment': 'myattachment' }).reply(401)

      await resolve.attachment(new Heroku(), null, 'myattachment')
        .catch((err) => expect(err, 'to satisfy', { statusCode: 401 }))

      throw new Error('unreachable')

      return api.done()
    })

    it('passes on errors getting app/attachment', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-2' }).reply(401)

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-2')
        .catch((err) => expect(err, 'to satisfy', { statusCode: 401 }))

      throw new Error('unreachable')

      return api.done()
    })

    it('falls back to searching by addon', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-3' }).reply(404, { 'resource': 'add_on attachment' })

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-3' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{ app: { name: 'myapp' }, name: 'some-random-name' }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-3')

      expect(addon, 'to satisfy', { name: 'some-random-name' });
      api.done();
      appAddon.done();

      return appAttachment.done()
    })

    it('falls back to searching by addon and addon_service', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'add_on attachment' })

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-3', 'addon_service': 'slowdb' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{ app: { name: 'myapp' }, name: 'some-random-name', addon_service: { name: 'slowdb' } }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', { 'addon_service': 'slowdb' })

      expect(addon, 'to satisfy', { name: 'some-random-name' });
      api.done();
      appAddon.done();

      return appAttachment.done()
    })

    it('falls back to searching by addon and addon_service when ambigious', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-3', 'addon_service': 'slowdb' }).reply(200, [
          { app: { name: 'myapp' }, name: 'some-random-name-1' },
          { app: { name: 'myapp' }, name: 'some-random-name-2' }
        ])

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-3', 'addon_service': 'slowdb' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{ app: { name: 'myapp' }, name: 'some-random-name', addon_service: { name: 'slowdb' } }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', { 'addon_service': 'slowdb' })

      expect(addon, 'to satisfy', { name: 'some-random-name' });
      api.done();
      appAddon.done();

      return appAttachment.done()
    })

    it('throws original error when ambigious and searching by addon and addon_service is ambigious', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-3', 'addon_service': 'slowdb' }).reply(200, [
          { app: { name: 'myapp' }, name: 'some-random-name-1' },
          { app: { name: 'myapp' }, name: 'some-random-name-2' }
        ])

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-3', 'addon_service': 'slowdb' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [
          { app: { name: 'myapp' }, name: 'some-random-name-a', addon_service: { name: 'slowdb' } },
          { app: { name: 'myapp' }, name: 'some-random-name-b', addon_service: { name: 'slowdb' } }
        ])

      try {
        await resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', { 'addon_service': 'slowdb' })
        throw new Error('unreachable')
      } catch (err) {
        api.done()
        appAddon.done()
        appAttachment.done()
        expect(err, 'to satisfy', { message: 'Ambiguous identifier; multiple matching add-ons found: some-random-name-1, some-random-name-2.', type: 'addon_attachment' })
      }
    })

    it('falls back to searching by addon and ignores addon_service if not passed', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-3' }).reply(404)

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-3' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{ app: { name: 'myapp' }, name: 'some-random-name', addon_service: { name: 'slowdb' } }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-3')

      expect(addon, 'to satisfy', { name: 'some-random-name' });
      api.done();
      appAddon.done();

      return appAttachment.done()
    })

    it('throws an error when not found', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-4' }).reply(404, { 'resource': 'add_on attachment' })

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-4' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-4' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{ app: { name: 'not-myapp' }, name: 'some-random-name' }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-4')
        .catch((err) => expect(err, 'to satisfy', { message: 'Couldn\'t find that addon.' }))

      throw new Error('unreachable')
      api.done();
      appAddon.done();

      return appAttachment.done()
    })

    it('throws an error when app not found', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-4' }).reply(404, { 'resource': 'app' })

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-4' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-4' }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-4')
        .catch((err) => expect(err, 'to satisfy', { body: { 'resource': 'app' } }))

      throw new Error('unreachable')
      api.done();

      return appAddon.done()
    })

    it('throws an error when not found with addon_service', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-3', 'addon_service': 'slowdb' }).reply(404, { 'resource': 'add_on attachment' })

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-3', 'addon_service': 'slowdb' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-3' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [{ app: { name: 'myapp' }, name: 'some-random-name', addon_service: { name: 'not-slowdb' } }])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-3', { 'addon_service': 'slowdb' })
        .catch((err) => expect(err, 'to satisfy', { message: 'Couldn\'t find that addon.' }))

      throw new Error('unreachable')
      api.done();
      appAddon.done();

      return appAttachment.done()
    })

    it('does not fallback and throws error when there is no app', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': null, 'addon_attachment': 'myattachment-4' }).reply(404, { 'resource': 'add_on attachment' })

      await resolve.attachment(new Heroku(), null, 'myattachment-4')
        .catch((err) => expect(err, 'to satisfy', { message: 'Couldn\'t find that addon.' }))

      throw new Error('unreachable')

      return api.done()
    })

    it('throws an error when ambiguous', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-5' }).reply(404, { 'resource': 'add_on attachment' })

      let appAddon = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myattachment-5' }).reply(200, [{ id: '1e97e8ba-fd24-48a4-8118-eaf287eb7a0f', name: 'myaddon-5' }])

      let appAttachment = nock('https://api.heroku.com:443')
        .get('/addons/1e97e8ba-fd24-48a4-8118-eaf287eb7a0f/addon-attachments').reply(200, [
          { app: { name: 'myapp' }, name: 'some-random-name-1' },
          { app: { name: 'myapp' }, name: 'some-random-name-2' }
        ])

      await resolve.attachment(new Heroku(), 'myapp', 'myattachment-5')
        .catch((err) => expect(err, 'to satisfy', { message: 'Ambiguous identifier; multiple matching add-ons found: some-random-name-1, some-random-name-2.', type: 'addon_attachment' }))

      throw new Error('unreachable')
      api.done();
      appAddon.done();

      return appAttachment.done()
    })
  })

  describe('appAddon', () => {
    it('finds a single matching addon for an app', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-2' }).reply(200, [{ name: 'myaddon-2' }])

      await resolve.appAddon(new Heroku(), 'myapp', 'myaddon-2')

      expect(addon, 'to satisfy', { name: 'myaddon-2' });

      return api.done()
    })

    it('fails if not found', async () => {
      nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-5' }).reply(404)

      try {
        await resolve.appAddon(new Heroku(), 'myapp', 'myaddon-5')
        throw new Error('unreachable')
      } catch (err) {
        return expect(err, 'to satisfy', { statusCode: 404 })
      }
    })

    it('fails if ambiguous', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'myaddon-5' })
        .reply(200, [{ 'name': 'myaddon-5' }, { 'name': 'myaddon-6' }])

      try {
        await resolve.appAddon(new Heroku(), 'myapp', 'myaddon-5')
        throw new Error('unreachable')
      } catch (err) {
        api.done()
        expect(err, 'to satisfy', { message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon' })
      }
    })
  })

  describe('appAttachment', () => {
    it('finds a single matching attachment for an app', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myattachment-1' }).reply(200, [{ name: 'myattachment-1' }])

      await resolve.appAttachment(new Heroku(), 'myapp', 'myattachment-1')

      expect(addon, 'to satisfy', { name: 'myattachment-1' });

      return api.done()
    })

    it('fails if not found', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': null, 'addon_attachment': 'myattachment' }).reply(404)

      await resolve.appAttachment(new Heroku(), null, 'myattachment')
        .catch((err) => expect(err, 'to satisfy', { statusCode: 404 }))

      throw new Error('unreachable')

      return api.done()
    })

    it('fails if ambiguous', async () => {
      let api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', { 'app': 'myapp', 'addon_attachment': 'myaddon-5' })
        .reply(200, [{ 'name': 'myaddon-5' }, { 'name': 'myaddon-6' }])

      try {
        await resolve.appAttachment(new Heroku(), 'myapp', 'myaddon-5')
        throw new Error('unreachable')
      } catch (err) {
        expect(err, 'to satisfy', { message: 'Ambiguous identifier; multiple matching add-ons found: myaddon-5, myaddon-6.', type: 'addon_attachment' })
        api.done()
      }
    })
  })
})
