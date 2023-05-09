'use strict'
/* globals afterEach beforeEach */

const {expect} = require('chai')
const sinon = require('sinon')
const Dyno = require('../../lib/dyno')
const cmd = require('../../commands/rake')

describe('rake', () => {
  let dynoStub
  let dynoOpts

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
