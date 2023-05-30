'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'login')
const {expect} = require('chai')
const sinon = require('sinon')

const Sanbashi = require('../../../lib/sanbashi')
let sandbox

describe('container login', () => {
  beforeEach(() => {
    cli.mockConsole()
    process.env.HEROKU_API_KEY = 'heroku_token'
    sandbox = sinon.createSandbox()
  })
  afterEach(() => sandbox.restore())

  it('logs to the docker registry', () => {
    let version = sandbox.stub(Sanbashi, 'version').returns([19, 12])
    let login = sandbox.stub(Sanbashi, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password-stdin', 'registry.heroku.com'], {input: 'heroku_token'})

    return cmd.run({flags: {}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(version))
      .then(() => sandbox.assert.calledOnce(login))
  })

  it('logs to the docker registry with an old version', () => {
    let version = sandbox.stub(Sanbashi, 'version').returns([17, 0])
    let login = sandbox.stub(Sanbashi, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password=heroku_token', 'registry.heroku.com'])

    return cmd.run({flags: {}, auth: {password: 'token'}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => sandbox.assert.calledOnce(version))
      .then(() => sandbox.assert.calledOnce(login))
  })
})
