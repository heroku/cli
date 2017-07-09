'use strict'
/* globals describe it beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'config' && c.command === 'unset')
const expect = require('unexpected')

describe('config:unset', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('removes a config var', () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', {FOO: null})
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])
    return cmd.run({app: 'myapp', args: ['FOO']})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to equal', 'Unsetting FOO and restarting myapp... done, v10\n'))
      .then(() => api.done())
  })
})
