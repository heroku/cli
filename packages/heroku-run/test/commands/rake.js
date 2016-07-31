'use strict'
/* globals describe beforeEach afterEach it */

const expect = require('unexpected')
const sinon = require('sinon')
const Dyno = require('../../lib/dyno')
const cmd = require('../..').commands.find(c => c.topic === 'rake' && !c.command)

describe('rake', () => {
  let dynoStub, dynoOpts

  beforeEach(() => {
    dynoStub = sinon.stub(Dyno.prototype, 'start', function () {
      dynoOpts = this.opts
      return Promise.resolve()
    })
  })

  it('runs rake', () => {
    return cmd.run({app: 'heroku-run-test-app', flags: {}, args: ['test']})
    .then(() => expect(dynoOpts.command, 'to equal', 'rake test'))
  })

  afterEach(() => {
    dynoStub.restore()
  })
})
