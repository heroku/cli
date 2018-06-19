'use strict'
/* globals describe it beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'sessions' && c.command === 'destroy')

describe('sessions:destroy', function () {
  let api
  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    api.done()
    nock.cleanAll()
  })

  it('destroys the session', function () {
    api.delete('/oauth/sessions/f6e8d969-129f-42d2-854b-c2eca9d5a42e').reply(200)
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {}})
  })
})
