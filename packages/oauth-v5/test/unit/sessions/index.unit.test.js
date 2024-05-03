/* eslint-env mocha */
'use strict'

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../lib/commands/sessions')

describe('clients', () => {
  let api
  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    api.done()
    nock.cleanAll()
  })

  describe('with authorizations', () => {
    beforeEach(() => {
      api = api
        .get('/oauth/sessions')
        .reply(200, [{description: 'Session @ 166.176.184.223', id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}])
    })

    it('lists the sessions', () => {
      return cmd.run({flags: {}})
        .then(() => expect(cli.stdout).to.equal('Session @ 166.176.184.223  f6e8d969-129f-42d2-854b-c2eca9d5a42e\n'))
    })

    it('lists the sessions as json', () => {
      return cmd.run({flags: {json: true}})
        .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {description: 'Session @ 166.176.184.223'}))
    })
  })

  describe('without authorizations', () => {
    beforeEach(() => {
      api = api
        .get('/oauth/sessions')
        .reply(200, [])
    })

    it('shows no clients message', () => {
      return cmd.run({flags: {}})
        .then(() => expect(cli.stdout).to.equal('No OAuth sessions.\n'))
    })
  })
})
