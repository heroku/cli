'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'pull')
const {expect} = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../../lib/sanbashi')
const nock = require('nock')
const testutil = require('../../testutil')
let sandbox

describe('container pull', () => {
  beforeEach(() => {
    cli.mockConsole()
    sandbox = sinon.createSandbox()
    cli.exit.mock()
  })
  afterEach(() => {
    sandbox.restore()
    nock.cleanAll()
  })

  it('requires a process type', async () => {
    await testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: [], flags: {}}))
      .then(error => {
        expect(error.message).to.contain('Requires one or more process types')
      })
  })

  it('exits when the app stack is not "container"', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})

    return testutil.assertErrorExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
      .then(error => {
        expect(error.message).to.equal('This command is only supported for the container stack. The stack for app testapp is heroku-24.')
        api.done()
      })
  })

  it('pulls from the docker registry', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'container'}})

    let pull = sandbox.stub(Sanbashi, 'pullImage')
      .withArgs('registry.heroku.com/testapp/web')

    return cmd.run({app: 'testapp', args: ['web'], flags: {}})
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => expect(cli.stdout).to.contain('Pulling web as registry.heroku.com/testapp/web'))
      .then(() => sandbox.assert.calledOnce(pull))
      .then(() => api.done())
  })
})
