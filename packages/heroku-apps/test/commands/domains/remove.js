'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/domains/remove')

describe('domains:remove', function () {
  beforeEach(() => cli.mockConsole())

  it('removes a domain', function () {
    let api = nock('https://api.heroku.com:443')
      .delete('/apps/myapp/domains/foo.com')
      .reply(200, {})
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
      .then(() => api.done())
  })
})
