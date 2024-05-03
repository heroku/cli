'use strict'
/* globals beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'logout')
const {expect} = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../../lib/sanbashi')
let sandbox

describe('container logout', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('logs out of the docker registry', () => {
    let logout = sandbox.stub(Sanbashi, 'cmd')
      .withArgs('docker', ['logout', 'registry.heroku.com'])

    return cmd.run({flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(logout))
  })
})
