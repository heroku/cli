/* eslint-env mocha */
'use strict'

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../lib/commands/authorizations/rotate')

describe('authorizations:rotate', () => {
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
      .post('/oauth/authorizations/10/actions/regenerate-tokens')
      .reply(200, {scope: ['global'], access_token: {token: 'secrettoken'}})
  })

  it('updates the authorization', () => {
    return cmd.run({args: {id: '10'}})
  })
})
