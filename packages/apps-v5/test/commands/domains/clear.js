'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/domains/clear')

describe('domains:clear', function () {
  beforeEach(() => cli.mockConsole())

  it('removes all domains', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains')
      .reply(200, [
        { kind: 'custom', hostname: 'foo.com' },
        { kind: 'custom', hostname: 'foo2.com' }
      ])
      .delete('/apps/myapp/domains/foo.com').reply(200)
      .delete('/apps/myapp/domains/foo2.com').reply(200)
    return cmd.run({ app: 'myapp' })
      .then(() => api.done())
  })
})
