'use strict';

let cmd = commands.find(c => c.topic === 'releases' && c.command === 'info');
let expect = require('unexpected');

let d = new Date(2000, 1, 1);

describe('releases:info', function() {
  beforeEach(() => cli.mockConsole());

  it('shows most recent release info', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])
      .get('/apps/myapp/releases/10')
      .reply(200, {name: 'v10', descr: 'something changed', user: 'foo@foo.com', created_at: d, env: {foo: 'bar'}});
    return cmd.run({app: 'myapp', flags: {}, args: {}})
    .then(() => expect(cli.stdout, 'to equal', `=== Release v10
By:      foo@foo.com
Change:  something changed
When:    ${d.toISOString()}

=== v10 Config vars
foo: bar
`))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('shows release info by id', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {name: 'v10', descr: 'something changed', user: 'foo@foo.com', created_at: d, env: {foo: 'bar'}});
    return cmd.run({app: 'myapp', flags: {}, args: {release: 'v10'}})
    .then(() => expect(cli.stdout, 'to equal', `=== Release v10
By:      foo@foo.com
Change:  something changed
When:    ${d.toISOString()}

=== v10 Config vars
foo: bar
`))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('shows recent release as json', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {name: 'v10', descr: 'something changed', user: 'foo@foo.com', created_at: d, env: {foo: 'bar'}});
    return cmd.run({app: 'myapp', flags: {json: true}, args: {release: 'v10'}})
    .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {name: 'v10'}))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });
});
