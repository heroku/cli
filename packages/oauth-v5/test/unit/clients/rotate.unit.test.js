'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const {expect} = require('chai')
const cmd = require('../../../lib/commands/clients/rotate')

describe('clients:rotate', () => {
  let api
  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    api.done()
    nock.cleanAll()
  })

  it('rotates the client secret', () => {
    api.post('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e/actions/rotate-credentials')
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {url: 'https://heroku.com'}})
      .then(() => expect(cli.stdout).to.equal('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e\n=== awesome\nid:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\nname:         awesome\nredirect_uri: https://myapp.com\nsecret:       clientsecret\n'))
      .then(() => api.done())
  })

  it('rotates the client secret when json flag is passed', () => {
    api.post('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e/actions/rotate-credentials')
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {url: 'https://heroku.com', json: true}})
      .then(() => expect(cli.stdout).to.equal('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e\n{\n  "name": "awesome",\n  "id": "f6e8d969-129f-42d2-854b-c2eca9d5a42e",\n  "redirect_uri": "https://myapp.com",\n  "secret": "clientsecret"\n}\n'))
      .then(() => api.done())
  })

  it('rotates the client secret when shell flag is passed', () => {
    api.post('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e/actions/rotate-credentials')
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com',
        secret: 'clientsecret',
      })
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {url: 'https://heroku.com', shell: true}})
      .then(() => expect(cli.stdout).to.equal('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=clientsecret\n'))
      .then(() => api.done())
  })
})
