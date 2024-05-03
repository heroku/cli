/* eslint-env mocha */
'use strict'

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../lib/commands/authorizations/revoke')

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
      .delete('/oauth/authorizations/10')
      .reply(201, {description: 'fooo'})
  })

  it('revokes the authorization', () => {
    return cmd.run({args: {id: '10'}})
  })
})
