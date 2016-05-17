'use strict'
/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
let nock = require('nock')
let cmd = require('../../commands/authorizations/index')

describe('authorizations', function () {
  beforeEach(() => cli.mockConsole())

  it('lists the authorizations', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/oauth/authorizations')
      .reply(200, [{description: 'awesome', id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', scope: ['app', 'user']}])
    return cmd.run({flags: {}})
      .then(() => expect(cli.stdout, 'to equal', 'awesome      f6e8d969-129f-42d2-854b-c2eca9d5a42e  app,user\n'))
      .then(() => api.done())
  })
})
