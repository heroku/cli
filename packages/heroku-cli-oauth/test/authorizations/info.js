'use strict'
/* globals describe it beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const cmd = commands.find(c => c.topic === 'authorizations' && c.command === 'info')

describe('authorizations:info', () => {
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
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: {token: 'secrettoken'}
      })
  })

  it('shows the authorization', () => {
    return cmd.run({args: {id: '10'}, flags: {}})
    .then(() => expect(cli.stdout, 'to equal', `Client:      <none>
ID:          10
Description: desc
Scope:       global
Token:       secrettoken\n`))
  })

  it('shows the authorization as json', () => {
    return cmd.run({args: {id: '10'}, flags: {json: true}})
    .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {id: '10'}))
  })
})
