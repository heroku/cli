'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/drains')
const expect = require('chai').expect

describe('drains', function () {
  beforeEach(() => cli.mockConsole())

  it('shows log drains', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/log-drains')
      .reply(200, [{
        token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
        url: 'https://forker.herokuapp.com' }])

    await cmd.run({ app: 'myapp', flags: {} })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== Drains
https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259)
`);

    return api.done()
  })

  it('shows add-on drains', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/log-drains')
      .reply(200, [{
        addon: { name: 'add-on-123' },
        token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
        url: 'https://forker.herokuapp.com' }])
      .get('/apps/myapp/addons/add-on-123')
      .reply(200, { name: 'add-on-123', plan: { name: 'add-on:test' } })

    await cmd.run({ app: 'myapp', flags: {} })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(`=== Add-on Drains
add-on:test (add-on-123)
`);

    return api.done()
  })

  it('shows drain_id for both', async function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/log-drains?extended=true')
      .reply(200, [{
        addon: { name: 'add-on-123' },
        token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
        url: 'https://forker.herokuapp.com',
        extended: {
          drain_id: 12345
        }
      }, {
        token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
        url: 'https://forker.herokuapp.com',
        extended: {
          drain_id: 67890
        }
      }])
      .get('/apps/myapp/addons/add-on-123')
      .reply(200, { name: 'add-on-123', plan: { name: 'add-on:test' } })

    await cmd.run({ app: 'myapp', flags: { extended: true } })

    expect(cli.stderr).to.equal('');

    expect(cli.stdout).to.equal(
        `=== Drains
https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259) drain_id=67890
=== Add-on Drains
add-on:test (add-on-123) drain_id=12345
`);

    return api.done()
  })
})
