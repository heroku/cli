/* eslint-env mocha */
'use strict'

const cli = require('heroku-cli-util')
const {expect} = require('chai')
let nock = require('nock')
let cmd = require('../../lib/commands/clients/create')

describe('clients:create', function () {
  beforeEach(() => cli.mockConsole())

  it('creates the client', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/oauth/clients', {
        name: 'awesome',
        redirect_uri: 'https://myapp.com',
      })
      .reply(201, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })
    return cmd.run({args: {name: 'awesome', redirect_uri: 'https://myapp.com'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e
HEROKU_OAUTH_SECRET=clientsecret
`))
      .then(() => api.done())
  })
})
