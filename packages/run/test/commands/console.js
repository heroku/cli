'use strict'
/* globals describe beforeEach afterEach it */

const expect = require('unexpected')
const sinon = require('sinon')
const Dyno = require('../../lib/dyno')
const cmd = require('../..').commands.find(c => c.topic === 'console' && !c.command)

describe('console', () => {
  let dynoStub, dynoOpts

  beforeEach(() => {
    dynoStub = sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      dynoOpts = this.opts
      return Promise.resolve()
    })
  })

  it('runs console', () => {
    return cmd.run({app: 'heroku-run-test-app', flags: {}})
      .then(() => expect(dynoOpts.command, 'to equal', 'console'))
  })

  afterEach(() => {
    dynoStub.restore()
  })
})
