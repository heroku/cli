'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const proxyquire = require('proxyquire')
const td = require('testdouble')

let netrcMock = td.constructor(require('netrc-parser'))
// get command from index.js
const cmd = proxyquire('../../../commands/auth/logout', {'netrc-parser': netrcMock})[0]
const expect = require('unexpected')

describe('auth:logout', () => {
  beforeEach(() => cli.mockConsole())

  it('logs out the user', () => {
    let machines = {
      'api.heroku.com': { login: 'u', password: 'p' },
      'git.heroku.com': { login: 'u', password: 'p' }
    }
    netrcMock.prototype.machines = machines
    return cmd.run({})
      .then(() => {
        td.verify(netrcMock.prototype.save())
        expect(machines, 'to equal', {})
        expect(cli.stderr, 'to be empty')
        expect(cli.stdout, 'to equal', 'Local credentials cleared\n')
      })
  })
})
