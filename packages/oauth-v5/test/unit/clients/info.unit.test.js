'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
let nock = require('nock')
let cmd = require('../../../lib/commands/clients/info')

describe('clients:info', function () {
  beforeEach(() => cli.mockConsole())

  const id = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const client = {name: 'awesome', id, redirect_uri: 'https://myapp.com', secret: 'supersecretkey'}

  let api
  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
      .get('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200, client)
  })
  afterEach(() => api.done())

  it('gets the client info', function () {
    return cmd.run({args: {id}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== awesome
id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e
name:         awesome
redirect_uri: https://myapp.com
secret:       supersecretkey
`))
  })

  it('gets the client info as json', function () {
    return cmd.run({args: {id}, flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {name: 'awesome'}))
  })

  it('gets the client info as shell', function () {
    return cmd.run({args: {id}, flags: {shell: true}})
      .then(() => expect(cli.stdout).to.equal(`HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e
HEROKU_OAUTH_SECRET=supersecretkey
`))
  })
})
