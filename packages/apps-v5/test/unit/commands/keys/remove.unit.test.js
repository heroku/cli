'use strict'
/* globals commands beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'keys' && c.command === 'remove')
const expect = require('chai').expect

describe('keys:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('removes an SSH key', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{id: 1, comment: 'user@machine'}])
      .delete('/account/keys/1')
      .reply(200)
    return cmd.run({args: {key: 'user@machine'}})
      .then(() => expect('').to.equal(cli.stdout))
      .then(() => expect('Removing user@machine SSH key... done\n').to.equal(cli.stderr))
      .then(() => api.done())
  })

  it('errors if no SSH keys on account', () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [])
    return cmd.run({args: {key: 'user@machine'}})
      .catch(function (error) {
        expect(error).to.be.an.instanceof(Error)
        expect(error.message).to.equal('No SSH keys on account')
      })
  })

  it('errors with incorrect SSH key on account', () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{id: 1, comment: 'user@machine'}])
    return cmd.run({args: {key: 'different@machine'}})
      .catch(function (error) {
        expect(error).to.be.an.instanceof(Error)
        expect(error.message).to.equal('SSH Key different@machine not found.\nFound keys: user@machine.')
      })
  })
})
