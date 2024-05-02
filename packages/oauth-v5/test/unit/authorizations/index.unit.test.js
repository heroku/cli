/* eslint-env mocha */
'use strict'

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../lib/commands/authorizations')

describe('authorizations', function () {
  let api
  beforeEach(() => cli.mockConsole())
  afterEach(() => api.done())

  describe('with authorizations', () => {
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/oauth/authorizations')
        .reply(200, [{description: 'awesome', id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', scope: ['app', 'user']}])
    })

    it('lists the authorizations', function () {
      return cmd.run({flags: {}})
        .then(() => expect(cli.stdout).to.equal('awesome      f6e8d969-129f-42d2-854b-c2eca9d5a42e  app,user\n'))
    })

    it('lists the authorizations as json', function () {
      return cmd.run({flags: {json: true}})
        .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {description: 'awesome'}))
    })
  })

  describe('without authorizations', () => {
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/oauth/authorizations')
        .reply(200, [])
    })

    it('shows no authorizations message', function () {
      return cmd.run({flags: {}})
        .then(() => expect(cli.stdout).to.equal('No OAuth authorizations.\n'))
    })
  })
})
