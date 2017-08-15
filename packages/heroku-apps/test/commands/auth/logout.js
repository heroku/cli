'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')

const proxyquire = require('proxyquire')

// budget mock since testdouble does not support generators
const cliMock = function * () {
  cliMock.called = true
}

// get command from index.js
const cmd = proxyquire('../../../src/commands/auth/logout', {'heroku-cli-util': {logout: cliMock}})[0]
const expect = require('unexpected')

describe('auth:logout', () => {
  beforeEach(() => cli.mockConsole())

  it('logs out the user', () => {
    return cmd.run({})
      .then(() => {
        expect(cliMock.called, 'to be true')
        expect(cli.stderr, 'to be empty')
        expect(cli.stdout, 'to equal', 'Local credentials cleared\n')
      })
  })
})
