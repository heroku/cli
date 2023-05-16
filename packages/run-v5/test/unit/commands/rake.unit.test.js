'use strict'
/* globals afterEach beforeEach */

const {expect} = require('chai')
const sinon = require('sinon')
const Dyno = require('../../../lib/dyno')
const cmd = require('../../../commands/rake')

class ProcessedError extends Error {
  constructor(message, exitCode) {
    super(message)
    this.exitCode = exitCode
  }
}

describe('rake', () => {
  let dynoStub
  let dynoOpts
  let exitStub

  describe('when running rake successfully', () => {
    beforeEach(() => {
      dynoStub = sinon.stub(Dyno.prototype, 'start').callsFake(function () {
        dynoOpts = this.opts
        return Promise.resolve()
      })
    })

    it('runs rake', () => {
      return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, args: ['test']})
        .then(() => expect(dynoOpts.command).to.equal('rake test'))
    })

    afterEach(() => {
      dynoStub.restore()
    })
  })

  describe('when running rake unsuccessfully', () => {
    beforeEach(() => {
      dynoStub = sinon.stub(Dyno.prototype, 'start').callsFake(function () {
        dynoOpts = this.opts
        throw new ProcessedError('rake ran unsuccessfully', 1)
      })
      exitStub = sinon.stub(process, 'exit').callsFake(() => {})
    })

    it('runs rake', () => {
      return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, args: ['test']})
        .catch(error => expect(error.message).to.equal('rake ran unsuccessfully'))
    })

    afterEach(() => {
      dynoStub.restore()
      exitStub.restore()
    })
  })

  describe('when running rake unsuccessfully with regular error thrown', () => {
    beforeEach(() => {
      dynoStub = sinon.stub(Dyno.prototype, 'start').callsFake(function () {
        dynoOpts = this.opts
        throw new Error('rake ran unsuccessfully')
      })
    })

    it('runs rake', () => {
      return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}, args: ['test']})
        .catch(error => expect(error.message).to.equal('rake ran unsuccessfully'))
    })

    afterEach(() => {
      dynoStub.restore()
      exitStub.restore()
    })
  })
})
