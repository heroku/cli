'use strict'
/* global describe it beforeEach afterEach */

let sinon = require('sinon')
let expect = require('unexpected')
let git = require('../../lib/git')({httpGitHost: 'git.heroku.com', gitHost: 'heroku.com'})
let cp = require('child_process')
let EventEmitter = require('events')

describe('git', function () {
  let mock
  beforeEach(() => {
    mock = sinon.mock(cp)
  })
  afterEach(() => mock.restore())

  it('runs exec', function () {
    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(null, 'foo')
    return git.exec(['remote'])
    .then((data) => {
      expect(data, 'to equal', 'foo')
      mock.verify()
      mock.restore()
    })
  })

  it('runs spawn', function () {
    let emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('close'))
    return git.spawn(['remote'])
    .then(() => {
      mock.verify()
      mock.restore()
    })
  })

  it('gets heroku git remote config', function () {
    mock.expects('execFile').withArgs('git', ['config', 'heroku.remote']).yieldsAsync(null, 'staging')
    return git.remoteFromGitConfig()
    .then((remote) => expect(remote, 'to equal', 'staging'))
  })

  it('returns an http git url', function () {
    expect(git.httpGitUrl('foo'), 'to equal', 'https://git.heroku.com/foo.git')
  })

  it('returns an ssh git url', function () {
    expect(git.sshGitUrl('foo'), 'to equal', 'git@heroku.com:foo.git')
  })
})
