'use strict'
/* globals describe it beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const cmd = commands.find(c => c.topic === 'authorizations' && c.command === 'create')

describe('authorizations:create', () => {
  let api
  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  beforeEach(() => {
    api
      .post('/oauth/authorizations', {description: 'awesome'})
      .reply(201, {access_token: {token: 'secrettoken'}})
  })

  it('creates the authorization', () => {
    return cmd.run({flags: {description: 'awesome'}})
  })

  it('creates the authorization and just shows the token', () => {
    return cmd.run({flags: {description: 'awesome', short: true}})
    .then(() => expect(cli.stdout, 'to equal', 'secrettoken\n'))
  })
})
