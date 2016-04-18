'use strict';

let cmd = commands.find(c => c.topic === 'ps' && c.command === 'scale');
let expect = require('unexpected');

describe('ps:scale', function() {
  beforeEach(function() {
    cli.mockConsole();
    nock.cleanAll();
  });

  it('shows formation with no args', function() {
    let api = nock('https://api.heroku.com')
              .get('/apps/myapp/formation')
              .reply(200, [{type: 'web', quantity: 1, size: 'Free'}, {type: 'worker', quantity: 2, size: 'Free'}]);

    return cmd.run({app: 'myapp', args: []})
    .then(() => expect(cli.stdout, 'to equal', 'web=1:Free worker=2:Free\n'))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('scales web=1 worker=2', function() {
    let api = nock('https://api.heroku.com')
              .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '1'}, {type: 'worker', quantity: '2'}]})
              .reply(200, [{type: 'web', quantity: 1, size: 'Free'}, {type: 'worker', quantity: 2, size: 'Free'}]);

    return cmd.run({app: 'myapp', args: ['web=1', 'worker=2']})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Scaling dynos... done, now running web at 1:Free, worker at 2:Free\n'))
    .then(() => api.done());
  });

  it('scales web-1', function() {
    let api = nock('https://api.heroku.com')
              .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '+1'}]})
              .reply(200, [{type: 'web', quantity: 2, size: 'Free'}]);

    return cmd.run({app: 'myapp', args: ['web+1']})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Scaling dynos... done, now running web at 2:Free\n'))
    .then(() => api.done());
  });
});
