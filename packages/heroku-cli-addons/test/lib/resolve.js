'use strict';

let resolve = require('../../lib/resolve');
let expect  = require('unexpected');
let Heroku  = require('heroku-client');

describe('resolve', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  describe('addon', () => {
    it('finds a single matching addon', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/addons/myaddon').reply(200, {name: 'myaddon'});

      return resolve.addon(new Heroku(), null, 'myaddon')
      .then(addon => expect(addon, 'to satisfy', {name: 'myaddon'}))
      .then(() => api.done());
    });

    it('finds a single matching addon for an app', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons/myaddon').reply(200, {name: 'myaddon'});

      return resolve.addon(new Heroku(), 'myapp', 'myaddon')
      .then(addon => expect(addon, 'to satisfy', {name: 'myaddon'}))
      .then(() => api.done());
    });

    it('fails if no addon found', () => {
      nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons/myaddon').reply(404)
      .get('/addons/myaddon').reply(404);

      return resolve.addon(new Heroku(), 'myapp', 'myaddon')
      .then(() => {throw new Error('unreachable');})
      .catch(err => expect(err, 'to satisfy', {statusCode: 404}));
    });

    it('fails if errored', () => {
      nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons/myaddon').reply(401);

      return resolve.addon(new Heroku(), 'myapp', 'myaddon')
      .then(() => {throw new Error('unreachable');})
      .catch(err => expect(err, 'to satisfy', {statusCode: 401}));
    });
  });

  describe('attachment', () => {
    it('finds a single matching attachment', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/addon-attachments/myattachment').reply(200, {name: 'myattachment'});

      return resolve.attachment(new Heroku(), null, 'myattachment')
      .then(addon => expect(addon, 'to satisfy', {name: 'myattachment'}))
      .then(() => api.done());
    });

    it('finds a single matching attachment for an app', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addon-attachments/myattachment').reply(200, {name: 'myattachment'});

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment')
      .then(addon => expect(addon, 'to satisfy', {name: 'myattachment'}))
      .then(() => api.done());
    });

    it('passes on errors getting attachment', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/addon-attachments/myattachment').reply(401);

      return resolve.attachment(new Heroku(), null, 'myattachment')
      .then(() => {throw new Error('unreachable');})
      .catch(err => expect(err, 'to satisfy', {statusCode: 401}))
      .then(() => api.done());
    });

    it('passes on errors getting app/attachment', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addon-attachments/myattachment').reply(401);

      return resolve.attachment(new Heroku(), 'myapp', 'myattachment')
      .then(() => {throw new Error('unreachable');})
      .catch(err => expect(err, 'to satisfy', {statusCode: 401}))
      .then(() => api.done());
    });
  });
});
