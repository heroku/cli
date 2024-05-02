/* eslint-env mocha */
'use strict'

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const {expect} = require('chai')
const cmd = require('../../../lib/commands/authorizations/info')

const distanceInWordsToNow = require('date-fns/distance_in_words_to_now')

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

  it('shows the authorization', () => {
    api
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: {token: 'secrettoken'},
        updated_at: new Date(0),
      })
    return cmd.run({args: {id: '10'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`Client:      <none>
ID:          10
Description: desc
Scope:       global
Token:       secrettoken
Updated at:  ${new Date(0)} (${distanceInWordsToNow(new Date(0))} ago)
`))
  })

  it('shows the authorization as json', () => {
    api
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: {token: 'secrettoken'},
      })
    return cmd.run({args: {id: '10'}, flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {id: '10'}))
  })

  it('shows expires in', () => {
    api
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: {token: 'secrettoken', expires_in: 100000},
      })
    return cmd.run({args: {id: '10'}, flags: {}})
      .then(() => expect(cli.stdout).to.contain('(in 1 day)'))
  })
})
