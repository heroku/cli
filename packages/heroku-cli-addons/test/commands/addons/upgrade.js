'use strict';

let cmd = commands.find(c => c.topic === 'addons' && c.command === 'upgrade');
let expect = require('unexpected');
describe('addons:upgrade', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(() => nock.cleanAll());

  let addon = {name: 'redis-swiftly-123', addon_service: {name: 'heroku-redis'}, app: {name: 'myapp'}, plan: {name: 'premium-0'}};

  it('upgrades an add-on', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/heroku-redis').reply(200, addon)
      .patch('/apps/myapp/addons/redis-swiftly-123', {plan: {name: 'heroku-redis:hobby'}})
      .reply(200, {plan: {price: {cents: 0}}, provision_message: 'provision msg'});
    return cmd.run({app: 'myapp', args: {addon: 'heroku-redis', plan: 'heroku-redis:hobby'}})
    .then(() => expect(cli.stdout, 'to equal', 'provision msg\n'))
    .then(() => expect(cli.stderr, 'to equal', 'Changing redis-swiftly-123 on myapp from premium-0 to heroku-redis:hobby... done, free\n'))
    .then(() => api.done());
  });

  it('upgrades an add-on with only one argument', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/heroku-redis').reply(200, addon)
      .patch('/apps/myapp/addons/redis-swiftly-123', {plan: {name: 'heroku-redis:hobby'}})
      .reply(200, {plan: {price: {cents: 0}}});
    return cmd.run({app: 'myapp', args: {addon: 'heroku-redis:hobby'}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Changing redis-swiftly-123 on myapp from premium-0 to heroku-redis:hobby... done, free\n'))
    .then(() => api.done());
  });

  it('errors with no plan', () => {
    return expect(cmd.run({app: 'myapp', args: {addon: 'heroku-redis'}})
                  , 'to be rejected with', /Error: No plan specified/);
  });

  it('errors with invalid plan', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/heroku-redis').reply(200, addon)
      .get('/addon-services/heroku-redis/plans').reply(200, [
        {name: 'heroku-redis:free'},
        {name: 'heroku-redis:premium-0'},
      ])
      .patch('/apps/myapp/addons/redis-swiftly-123', {plan: {name: 'heroku-redis:invalid'}})
      .reply(422, {message: 'Couldn\'t find either the add-on service or the add-on plan of "heroku-redis:invalid".'});
    return expect(cmd.run({app: 'myapp', args: {addon: 'heroku-redis:invalid'}})
                  , 'to be rejected with', `Couldn't find either the add-on service or the add-on plan of "heroku-redis:invalid".

Here are the available plans for heroku-redis:
heroku-redis:free
heroku-redis:premium-0

See more plan information with heroku addons:plans heroku-redis

https://devcenter.heroku.com/articles/managing-add-ons`)
.then(() => api.done());
  });

  it('handles multiple add-ons', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/heroku-redis').reply(422, {id: 'multiple_matches', message: 'Ambiguous identifier; multiple matching add-ons found: redis-defined-2951, redis-rigid-2920.'});
    return expect(cmd.run({args: {addon: 'heroku-redis:invalid'}}),
           'to be rejected with', /multiple matching add-ons found/)
           .then(() => api.done());
  });
});
