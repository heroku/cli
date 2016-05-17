'use strict'
/* globals describe it beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'authorizations' && c.command === 'update')

describe('authorizations:update', () => {
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
      .patch('/oauth/authorizations/10', {description: 'awesome', client: {id: '100', secret: 'secret'}})
      .reply(200, {scope: ['global'], access_token: {token: 'secrettoken'}})
  })

  it('updates the authorization', () => {
    return cmd.run({args: {id: '10'}, flags: {'client-id': '100', 'client-secret': 'secret', description: 'awesome'}})
  })
})
