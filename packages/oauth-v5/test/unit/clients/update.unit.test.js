'use strict'
/* globals beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../lib/commands/clients/update')
const {expect} = require('chai')

describe('clients:update', () => {
  let api
  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    api.done()
    nock.cleanAll()
  })

  it('updates the client url', () => {
    api.patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {redirect_uri: 'https://heroku.com'})
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {url: 'https://heroku.com'}})
  })

  it('updates the client name', () => {
    api.patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {name: 'newname'})
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {name: 'newname'}})
  })

  it('does nothing with no changes', () => {
    return expect(cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {}}))
      .to.be.rejectedWith(Error, 'No changes provided.')
  })
})
