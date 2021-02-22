'use strict'
/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const cmd = require('../..').commands.find(c => c.topic === 'container' && c.command === 'rm')
const { expect } = require('chai')
const nock = require('nock')
const sinon = require('sinon')

describe('container removal', () => {
  beforeEach(() => cli.mockConsole())

  it('removes one container', async () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/testapp/formation/web')
      .reply(200, {})

    await cmd.run({ app: 'testapp', args: ['web'], flags: {} })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.contain('Removing container web for testapp... done');

    return api.done()
  })

  it('removes two containers', async () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/testapp/formation/web')
      .reply(200, {})
      .patch('/apps/testapp/formation/worker')
      .reply(200, {})

    await cmd.run({ app: 'testapp', args: ['web', 'worker'], flags: {} })

    expect(cli.stdout, 'to be empty');
    expect(cli.stderr).to.contain('Removing container web for testapp... done');
    expect(cli.stderr).to.contain('Removing container worker for testapp... done');

    return api.done()
  })

  it('requires a container to be specified', () => {
    const sandbox = sinon.createSandbox()
    sandbox.stub(process, 'exit')

    return cmd.run({ app: 'testapp', args: [], flags: {} })
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.contain('Please specify at least one target process type'))
      .then(() => expect(process.exit.calledWith(1)).to.equal(true))
      .finally(() => sandbox.restore())
  })
})
