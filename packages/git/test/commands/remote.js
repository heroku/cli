'use strict'
/* global describe it beforeEach afterEach */

const sinon = require('sinon')
const nock = require('nock')
const proxyquire = require('proxyquire')
const expect = require('unexpected')
const cli = require('heroku-cli-util')

describe('git:remote', function () {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('errors if no app', function () {
    const git = require('../mock/git')
    const remote = proxyquire('../../commands/git/remote', {'../../lib/git': () => git})

    return expect(
      remote.run({flags: {}, args: []}),
      'to be rejected with',
      {message: 'Specify an app with --app'})
  })

  it('replaces an http-git remote', function () {
    const git = require('../mock/git')
    const mock = sinon.mock(git)
    mock.expects('exec').withExactArgs(['remote']).once().returns(Promise.resolve('heroku'))
    mock.expects('exec').withExactArgs(['remote', 'set-url', 'heroku', 'https://git.heroku.com/myapp.git']).once().returns(Promise.resolve())
    const remote = proxyquire('../../commands/git/remote', {'../../lib/git': () => git})
    const api = nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'})

    return remote.run({flags: {app: 'myapp'}, args: []})
    .then(() => expect(cli.stdout, 'to equal', 'set git remote heroku to https://git.heroku.com/myapp.git\n'))
    .then(() => {
      mock.verify()
      mock.restore()
      api.done()
    })
  })

  it('adds an http-git remote', function () {
    const git = require('../mock/git')
    const mock = sinon.mock(git)
    mock.expects('exec').withExactArgs(['remote']).once().returns(Promise.resolve(''))
    mock.expects('exec').withExactArgs(['remote', 'add', 'heroku', 'https://git.heroku.com/myapp.git']).once().returns(Promise.resolve())
    const remote = proxyquire('../../commands/git/remote', {'../../lib/git': () => git})
    const api = nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'})

    return remote.run({flags: {app: 'myapp'}, args: []})
    .then(() => expect(cli.stdout, 'to equal', 'set git remote heroku to https://git.heroku.com/myapp.git\n'))
    .then(() => {
      mock.verify()
      mock.restore()
      api.done()
    })
  })
})
