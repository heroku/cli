'use strict'
/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../commands/clients/update')

describe('clients:update', function () {
  beforeEach(() => cli.mockConsole())

  it('creates the client', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {name: 'newname'})
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret'
      })
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {name: 'newname'}})
      .then(() => api.done())
  })
})
