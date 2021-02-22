'use strict'
/* globals commands it describe beforeEach afterEach cli nock */

let cmd = commands.find((c) => c.topic === 'addons' && c.command === 'upgrade')
const { expect } = require('chai')
let cache = require('../../../lib/resolve').addon.cache

describe('addons:upgrade', () => {
  beforeEach(() => {
    cli.mockConsole()
    cache.clear()
  })

  afterEach(() => nock.cleanAll())

  it('upgrades an add-on', async () => {
    let addon = { name: 'kafka-swiftly-123', addon_service: { name: 'heroku-kafka' }, app: { name: 'myapp' }, plan: { name: 'premium-0' } }

    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'heroku-kafka' }).reply(200, [addon])
      .patch('/apps/myapp/addons/kafka-swiftly-123', { plan: { name: 'heroku-kafka:hobby' } })
      .reply(200, { plan: { price: { cents: 0 } }, provision_message: 'provision msg' })

    await cmd.run({ app: 'myapp', args: { addon: 'heroku-kafka', plan: 'heroku-kafka:hobby' } })

    expect(cli.stdout).to.equal('provision msg\n');
    expect(cli.stderr).to.equal('Changing kafka-swiftly-123 on myapp from premium-0 to heroku-kafka:hobby... done, free\n');

    return api.done()
  })

  it('upgrades to a contract add-on', async () => {
    let addon = { name: 'connect-swiftly-123', addon_service: { name: 'heroku-connect' }, app: { name: 'myapp' }, plan: { name: 'free' } }

    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'heroku-connect' }).reply(200, [addon])
      .patch('/apps/myapp/addons/connect-swiftly-123', { plan: { name: 'heroku-connect:contract' } })
      .reply(200, { plan: { price: { cents: 0, contract: true } }, provision_message: 'provision msg' })

    await cmd.run({ app: 'myapp', args: { addon: 'heroku-connect', plan: 'heroku-connect:contract' } })

    expect(cli.stdout).to.equal('provision msg\n');
    expect(cli.stderr).to.equal('Changing connect-swiftly-123 on myapp from free to heroku-connect:contract... done, contract\n');

    return api.done()
  })

  it('upgrades an add-on with only one argument', async () => {
    let addon = { name: 'postgresql-swiftly-123', addon_service: { name: 'heroku-postgresql' }, app: { name: 'myapp' }, plan: { name: 'premium-0' } }

    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'heroku-postgresql' }).reply(200, [addon])
      .patch('/apps/myapp/addons/postgresql-swiftly-123', { plan: { name: 'heroku-postgresql:hobby' } })
      .reply(200, { plan: { price: { cents: 0 } } })

    await cmd.run({ app: 'myapp', args: { addon: 'heroku-postgresql:hobby' } })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.equal('Changing postgresql-swiftly-123 on myapp from premium-0 to heroku-postgresql:hobby... done, free\n');

    return api.done()
  })

  it('errors with no plan', async () => {
    try {
      await cmd.run({ app: 'myapp', args: { addon: 'heroku-redis' } })
      throw new Error('unreachable')
    } catch (err) {
      return expect(err, 'to satisfy', /Error: No plan specified/)
    }
  })

  it('errors with invalid plan', async () => {
    let addon = { name: 'db1-swiftly-123', addon_service: { name: 'heroku-db1' }, app: { name: 'myapp' }, plan: { name: 'premium-0' } }

    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', { 'app': 'myapp', 'addon': 'heroku-db1' }).reply(200, [addon])
      .get('/addon-services/heroku-db1/plans').reply(200, [
        { name: 'heroku-db1:free' },
        { name: 'heroku-db1:premium-0' }
      ])
      .patch('/apps/myapp/addons/db1-swiftly-123', { plan: { name: 'heroku-db1:invalid' } })
      .reply(422, { message: 'Couldn\'t find either the add-on service or the add-on plan of "heroku-db1:invalid".' })

    await cmd.run({ app: 'myapp', args: { addon: 'heroku-db1:invalid' } })
      .catch((err) => expect(err.message).to.equal(`Couldn't find either the add-on service or the add-on plan of "heroku-db1:invalid".

Here are the available plans for heroku-db1:
heroku-db1:free
heroku-db1:premium-0

See more plan information with heroku addons:plans heroku-db1

https://devcenter.heroku.com/articles/managing-add-ons`))

    throw new Error('unreachable')

    return api.done()
  })

  it('handles multiple add-ons', async () => {
    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', { 'app': null, 'addon': 'heroku-redis' })
      .reply(200, [{ 'name': 'db1-swiftly-123' }, { 'name': 'db1-swiftly-456' }])

    try {
      await cmd.run({ args: { addon: 'heroku-redis:invalid' } })
      throw new Error('unreachable')
    } catch (err) {
      api.done()
      expect(err, 'to satisfy', /multiple matching add-ons found/)
    }
  })
})
