'use strict'
/* globals beforeEach */

const cli = require('@heroku/heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'rm')
const {expect} = require('chai')
const nock = require('nock')
const sinon = require('sinon')

describe('container removal', () => {
  beforeEach(() => cli.mockConsole())

  it('removes one container', () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/testapp/formation/web')
      .reply(200, {})

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.contain('Removing container web for testapp... done'))
      .then(() => api.done())
  })

  it('removes two containers', () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/testapp/formation/web')
      .reply(200, {})
      .patch('/apps/testapp/formation/worker')
      .reply(200, {})

    return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.contain('Removing container web for testapp... done'))
      .then(() => expect(cli.stderr).to.contain('Removing container worker for testapp... done'))
      .then(() => api.done())
  })

  it('requires a container to be specified', () => {
    const sandbox = sinon.createSandbox()
    sandbox.stub(process, 'exit')

    return cmd.run({app: 'testapp', args: [], flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.contain('Please specify at least one target process type'))
      .then(() => expect(process.exit.calledWith(1)).to.equal(true))
      .finally(() => sandbox.restore())
  })
})
