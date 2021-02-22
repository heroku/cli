'use strict'
/* globals describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'logout')
const { expect } = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../lib/sanbashi')
let sandbox

describe('container logout', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('logs out of the docker registry', async () => {
    let logout = sandbox.stub(Sanbashi, 'cmd')
      .withArgs('docker', ['logout', 'registry.heroku.com'])

    await cmd.run({ flags: {} })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr, 'to be empty');

    return sandbox.assert.calledOnce(logout)
  })
})
