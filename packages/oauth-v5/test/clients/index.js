'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../lib/commands/clients/index')

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
        .get('/oauth/clients')
        .reply(200, [{name: 'awesome', id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', redirect_uri: 'https://myapp.com'}])
    })

    it('lists the clients', () => {
      return cmd.run({flags: {}})
        .then(() => expect(cli.stdout).to.equal('awesome  f6e8d969-129f-42d2-854b-c2eca9d5a42e  https://myapp.com\n'))
    })

    it('lists the clients as json', () => {
      return cmd.run({flags: {json: true}})
        .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {name: 'awesome'}))
    })
  })

  describe('without authorizations', () => {
    beforeEach(() => {
      api = api
        .get('/oauth/clients')
        .reply(200, [])
    })

    it('shows no clients message', () => {
      return cmd.run({flags: {}})
        .then(() => expect(cli.stdout).to.equal('No OAuth clients.\n'))
    })
  })
})
