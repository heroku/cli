'use strict'
/* globals commands describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const cmd = commands.find((c) => c.topic === 'ps' && c.command === 'stop')

describe('ps:stop', function () {
  beforeEach(() => {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('stops all web dynos', function () {
    let api = nock('https://api.heroku.com')
      .post('/apps/myapp/ps/stop?type=web').reply(200)

    return cmd.run({app: 'myapp', args: {dyno: 'web'}})
      .then(() => api.done())
  })

  it('stops run.10 dyno', function () {
    let api = nock('https://api.heroku.com')
      .post('/apps/myapp/ps/stop?ps=run.10').reply(200)

    return cmd.run({app: 'myapp', args: {dyno: 'run.10'}})
      .then(() => api.done())
  })

  it('parses the error body', function () {
    let api = nock('https://api.heroku.com')
      .post('/apps/myapp/ps/stop?ps=run.10').reply(404, {'id': 'not_found'})

    return cmd.run({app: 'myapp', args: {dyno: 'run.10'}})
      .then(() => expect.fail('', '', 'expected error'))
      .catch((err) => expect(err.body).to.eql({'id': 'not_found'}))
      .then(() => api.done())
  })
})
