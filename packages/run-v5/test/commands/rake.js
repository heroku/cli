'use strict'

const expect = require('unexpected')
const sinon = require('sinon')
const Dyno = require('../../lib/dyno')
const cmd = require('../../commands/rake')

describe('rake', () => {
  let dynoStub, dynoOpts

  beforeEach(() => {
    dynoStub = sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      dynoOpts = this.opts
      return Promise.resolve()
    })
  })

  it('runs rake', async () => {
    await cmd.run({ app: 'heroku-run-test-app', flags: {}, args: ['test'] })
    expect(dynoOpts.command, 'to equal', 'rake test')
  })

  afterEach(() => {
    dynoStub.restore()
  })
})
