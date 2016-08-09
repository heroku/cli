'use strict'

/* globals describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const {commands} = require('../../..')
const cmd = commands.find(c => c.topic === 'auth' && c.command === 'whoami')

describe(`${cmd.topic}${cmd.command ? ':' + cmd.command : ''}`, () => {
  let api
  beforeEach(() => {
    cli.mockConsole()
    api = nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, {email: 'foo@foo.com'})
  })

  afterEach(() => {
    api.done()
  })

  it('shows the logged in user', () => {
    return cmd.run()
    .then(() => cli.stdout.should.eq('foo@foo.com\n'))
  })
})
