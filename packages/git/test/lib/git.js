'use strict'
/* global describe it beforeEach afterEach */

const sinon = require('sinon')
const expect = require('unexpected')
const git = require('../../lib/git')({httpGitHost: 'git.heroku.com', gitHost: 'heroku.com'})
const cp = require('child_process')
const EventEmitter = require('events')

describe('git', function () {
  let mock
  beforeEach(() => {
    mock = sinon.mock(cp)
  })
  afterEach(() => mock.restore())

  it('runs exec', function () {
    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(null, 'foo')
    return git.exec(['remote'])
    .then(data => {
      expect(data, 'to equal', 'foo')
      mock.verify()
    })
  })

  it('translates exec Errno::ENOENT to a friendlier error message', function () {
    const err = new Error()
    err.code = 'ENOENT'

    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(err, null)

    return expect(git.exec(['remote']), 'to be rejected with', 'Git must be installed to use the Heroku CLI.  See instructions here: http://git-scm.com')
  })

  it('exec passes through all other errors', function () {
    const err = new Error('Some other error message')

    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(err, null)

    return expect(git.exec(['remote']), 'to be rejected with', err.message)
  })

  it('runs spawn', function () {
    const emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('close'))
    return git.spawn(['remote'])
    .then(() => mock.verify())
  })

  it('translates spawn Errno::ENOENT to a friendlier error message', function () {
    const err = new Error()
    err.code = 'ENOENT'

    const emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('error', err))

    return expect(git.spawn(['remote']), 'to be rejected with', 'Git must be installed to use the Heroku CLI.  See instructions here: http://git-scm.com')
  })

  it('spawn passes through all other errors', function () {
    const err = new Error('Some other error message')

    const emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('error', err))

    return expect(git.spawn(['remote']), 'to be rejected with', err.message)
  })

  it('gets heroku git remote config', function () {
    mock.expects('execFile').withArgs('git', ['config', 'heroku.remote']).yieldsAsync(null, 'staging')
    return git.remoteFromGitConfig()
    .then(remote => expect(remote, 'to equal', 'staging'))
    .then(() => mock.verify())
  })

  it('returns an http git url', function () {
    expect(git.url('foo', false), 'to equal', 'https://git.heroku.com/foo.git')
  })

  it('returns an ssh git url', function () {
    expect(git.url('foo', true), 'to equal', 'git@heroku.com:foo.git')
  })
})
