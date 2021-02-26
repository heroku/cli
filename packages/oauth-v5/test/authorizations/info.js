'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const { expect } = require('chai')
const cmd = require('../../lib/commands/authorizations/info')

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

  it('shows the authorization', async () => {
    api
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: { token: 'secrettoken' },
        updated_at: new Date(0)
      })
    await cmd.run({ args: { id: '10' }, flags: {} })

    return expect(cli.stdout).to.equal(`Client:      <none>
ID:          10
Description: desc
Scope:       global
Token:       secrettoken
Updated at:  ${new Date(0)} (${distanceInWordsToNow(new Date(0))} ago)
`)
  })

  it('shows the authorization as json', async () => {
    api
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: { token: 'secrettoken' }
      })
    await cmd.run({ args: { id: '10' }, flags: { json: true } })
    return expect(JSON.parse(cli.stdout), 'to satisfy', { id: '10' })
  })

  it('shows expires in', async () => {
    api
      .get('/oauth/authorizations/10')
      .reply(200, {
        id: '10',
        description: 'desc',
        scope: ['global'],
        access_token: { token: 'secrettoken', expires_in: 100000 }
      })
    await cmd.run({ args: { id: '10' }, flags: {} })
    return expect(cli.stdout).to.contain('(in 1 day)')
  })
})
