'use strict'
/* globals afterEach beforeEach */

const {expect} = require('chai')
const sinon = require('sinon')
const Dyno = require('../../lib/dyno')
const cmd = require('../../commands/console')

describe('console', () => {
  let dynoStub
  let dynoOpts

  beforeEach(() => {
    dynoStub = sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      dynoOpts = this.opts
      return Promise.resolve()
    })
  })

  it('runs console', () => {
    return cmd.run({app: 'heroku-cli-ci-smoke-test-app', flags: {}})
      .then(() => expect(dynoOpts.command).to.equal('console'))
  })

  afterEach(() => {
    dynoStub.restore()
  })
})
