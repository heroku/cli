'use strict';

let cmd = commands.find(c => c.topic === 'addons' && c.command === 'attach');
let expect = require('unexpected');

let confirmApp;

describe('addons:attach', function() {
  beforeEach(() => {
    confirmApp = cli.confirmApp;
    cli.confirmApp = () => Promise.resolve();
    cli.mockConsole();
  });
  afterEach(() => {
    cli.confirmApp = confirmApp;
    nock.cleanAll();
  });

  it('attaches an add-on', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(201, {name: 'REDIS'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}]);
    return cmd.run({app: 'myapp', args: {addon_name: 'redis-123'}, flags: {}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', `Attaching redis-123 to myapp... done
Setting REDIS config vars and restarting myapp... done, v10\n`))
    .then(() => api.done());
  });

  it('attaches an add-on as foo', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}]);
    return cmd.run({app: 'myapp', args: {addon_name: 'redis-123'}, flags: {as: 'foo'}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', `Attaching redis-123 as foo to myapp... done
Setting foo config vars and restarting myapp... done, v10\n`))
    .then(() => api.done());
  });

  it('overwrites an add-on as foo when confirmation is set', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(400, {id: 'confirmation_required'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}, confirm: 'myapp'})
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}]);
    return cmd.run({app: 'myapp', args: {addon_name: 'redis-123'}, flags: {as: 'foo'}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', `Attaching redis-123 as foo to myapp... !!!
Attaching redis-123 as foo to myapp... done
Setting foo config vars and restarting myapp... done, v10\n`))
    .then(() => api.done());
  });
});
