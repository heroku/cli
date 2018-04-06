'use strict'

const td = require('testdouble')
const proxyquire = require('proxyquire')

const netrc = td.constructor(require('netrc-parser'))
netrc['@global'] = true

let mockMachines = {}
netrc.default = new class {
  constructor () {
    this.loadSync = () => {
      this.machines = mockMachines
    }
  }
}()

const cli = proxyquire('heroku-cli-util', {'netrc-parser': netrc})

const cmd = proxyquire('../../../src/commands/auth/token', {'heroku-cli-util': cli})
const expect = require('unexpected')

describe('auth:token', () => {
  beforeEach(() => cli.mockConsole())

  it('shows logged in user', () => {
    mockMachines = {'api.heroku.com': {password: 'myapikey'}}
    return cmd.run({})
      .then(() => expect(cli.stdout, 'to equal', 'myapikey\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
  })
})
