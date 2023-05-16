'use strict'
/* globals beforeEach before after */

const cmd = require('../../commands/logs')
const cli = require('heroku-cli-util')
const {expect} = require('chai')
const {describeAcceptance} = require('../test-helper')
const nock = require('nock')
const HTTP = require('http-call')
const sinon = require('sinon')
let streamStub

// logplexURL: https://virginia.sessions.logs.heroku.com/stream?channel_id=app-4ff073b0-a194-4731-b760-58fcbe2666e3&num=100&ps=&region=us&source=&tail=false&timestamp=1684259916&token=y21HPDYbQNS5ezDt0DZEfFjHlEtFqOTz2idHF-F9hLU%3D

describeAcceptance('logs', () => {
  beforeEach(() => cli.mockConsole())

  it('shows the logs', () => {
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: {password: global.apikey}})
      .then(() => expect(cli.stdout.startsWith('20')).to.equal(true, 'starts with the year'))
  })

  describe('testing readlogsV1', () => {
    before(() => {
      // streamStub = sinon.stub(HTTP, 'stream')
      cli.mockConsole()
      // streamStub.resolves({
      //   status: 200,
      //   headers: {'Content-Type': 'application/json'},
      //   body: '{message: "Stubbed response"}',
      // })
      nock.disableNetConnect()
      nock('https://api.heroku.com')
        .post('/apps/heroku-cli-ci-smoke-test-app/log-sessions', {
          lines: 100,
        })
        .reply(200, {logplex_url: 'https://example.com/streaming?a=a&b=b&srv=foo'})
    })
    it('shows logs with srv query param', () => {
      return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, auth: {password: global.apikey}})
        .then(() => expect(cli.stdout).to.equal('hello'))
    })
    after(() => {
      // streamStub.restore()
      nock.enableNetConnect()
      nock.cleanAll()
    })
  })
})
