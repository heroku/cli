'use strict'
/* global beforeEach afterEach */

let sinon = require('sinon')
let nock = require('nock')
let proxyquire = require('proxyquire')
const {expect} = require('chai')
let cli = require('heroku-cli-util')

describe('git:remote', function () {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('errors if no app', function () {
    let git = require('../mock/git')
    let remote = proxyquire('../../commands/git/remote', {'../../lib/git': () => git})

    return expect(remote.run({flags: {}, args: []}))
      .to.be.rejectedWith(Error, 'Specify an app with --app')
  })

  it('replaces an http-git remote', function () {
    let git = require('../mock/git')
    let mock = sinon.mock(git)
    mock.expects('exec').withExactArgs(['remote']).once().returns(Promise.resolve('heroku'))
    mock.expects('exec').withExactArgs(['remote', 'set-url', 'heroku', 'https://git.heroku.com/myapp.git']).once().returns(Promise.resolve())
    let remote = proxyquire('../../commands/git/remote', {'../../lib/git': () => git})
    let api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return remote.run({flags: {app: 'myapp'}, args: []})
      .then(() => expect(cli.stdout.to.equal('set git remote heroku to https://git.heroku.com/myapp.git\n')))
      .then(() => {
        mock.verify()
        mock.restore()
        api.done()
      })
  })

  it('adds an http-git remote', function () {
    let git = require('../mock/git')
    let mock = sinon.mock(git)
    mock.expects('exec').withExactArgs(['remote']).once().returns(Promise.resolve(''))
    mock.expects('exec').withExactArgs(['remote', 'add', 'heroku', 'https://git.heroku.com/myapp.git']).once().returns(Promise.resolve())
    let remote = proxyquire('../../commands/git/remote', {'../../lib/git': () => git})
    let api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return remote.run({flags: {app: 'myapp'}, args: []})
      .then(() => expect(cli.stdout.to.equal('set git remote heroku to https://git.heroku.com/myapp.git\n')))
      .then(() => {
        mock.verify()
        mock.restore()
        api.done()
      })
  })
})
