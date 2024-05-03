'use strict'
/* globals beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'pull')
const {expect} = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../../lib/sanbashi')
let sandbox

describe('container pull', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('requires a process type', async () => {
    sandbox.stub(process, 'exit')

    await cmd.run({app: 'testapp', args: [], flags: {}})
      .then(() => expect(cli.stderr).to.contain('Requires one or more process types'))
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(process.exit.calledWith(1)).to.equal(true))
  })

  it('pulls from the docker registry', () => {
    let pull = sandbox.stub(Sanbashi, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => expect(cli.stdout).to.contain('Pulling web as registry.heroku.com/testapp/web'))
      .then(() => sandbox.assert.calledOnce(pull))
  })
})
