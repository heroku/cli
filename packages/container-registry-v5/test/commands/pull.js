'use strict'
/* globals describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'pull')
const { expect } = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../lib/sanbashi')
let sandbox

describe('container pull', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('requires a process type', async () => {
    sandbox.stub(process, 'exit')

    await cmd.run({ app: 'testapp', args: [], flags: {} })
    expect(cli.stderr).to.contain('Requires one or more process types');
    expect(cli.stdout, 'to be empty');
    expect(process.exit.calledWith(1)).to.equal(true);
  })

  it('pulls from the docker registry', async () => {
    let pull = sandbox.stub(Sanbashi, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stderr, 'to be empty');
    expect(cli.stdout).to.contain('Pulling web as registry.heroku.com/testapp/web');

    return sandbox.assert.calledOnce(pull)
  })
})
