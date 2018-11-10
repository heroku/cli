'use strict'
/* globals commands describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'keys' && c.command === 'remove')
const expect = require('chai').expect

describe('keys:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('removes an SSH key', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{ id: 1, comment: 'user@machine' }])
      .delete('/account/keys/1')
      .reply(200)
    return cmd.run({ args: { key: 'user@machine' } })
      .then(() => expect('').to.equal(cli.stdout))
      .then(() => expect('Removing user@machine SSH key... done\n').to.equal(cli.stderr))
      .then(() => api.done())
  })
})
