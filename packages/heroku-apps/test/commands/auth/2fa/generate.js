'use strict'
/* globals commands describe beforeEach afterEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')

// get command from index.js
const cmd = commands.find(c => c.topic === 'auth' && c.command === '2fa:generate')
const expect = require('unexpected')

describe('auth:2fa:generate', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('generates replacement 2fa codes', () => {
    cli.prompt = function () { return Promise.resolve('foobar') }

    let api = nock('https://api.heroku.com', {
      reqheaders: {
        'Heroku-Password': 'foobar'
      }
    })
      .post('/account/recovery-codes')
      .reply(200, ['19c6255cfdc6f2c0', '1fb5f44ba434179d'])

    return cmd.run({})
      .then(() => expect(cli.stdout, 'to equal', 'Recovery codes:\n19c6255cfdc6f2c0\n1fb5f44ba434179d\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('is aliased by 2fa:generate-recovery-codes', () => {
    const cmd = commands.find(c => c.topic === '2fa' && c.command === 'generate-recovery-codes')
    expect(cmd, 'to have own properties', {
      topic: '2fa',
      command: 'generate-recovery-codes'
    })
  })
})
