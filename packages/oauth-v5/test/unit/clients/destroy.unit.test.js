'use strict'
/* globals beforeEach */

const cli = require('@heroku/heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../lib/commands/clients/destroy')

describe('clients:destroy', function () {
  beforeEach(() => cli.mockConsole())

  it('destroys the client', function () {
    let api = nock('https://api.heroku.com:443')
      .delete('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200)
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {}})
      .then(() => api.done())
  })
})
