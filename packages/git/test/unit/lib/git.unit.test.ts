'use strict'
/* global beforeEach afterEach */

import sinon from 'sinon'
import {expect} from 'chai'
import cp from 'child_process'
import EventEmitter from 'events'
import Git from '../../../src/git'

describe('git', function () {
  let mock: sinon.SinonMock
  let git: Git
  beforeEach(() => {
    mock = sinon.mock(cp)
    git = new Git()
  })
  afterEach(() => mock.restore())

  it.skip('runs exec', function () {
    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(null, 'foo')
    return git.exec(['remote'])
      .then((data: string) => {
        expect(data).to.equal('foo')
        mock.verify()
      })
  })

  it.skip('translates exec Errno::ENOENT to a friendlier error message', function () {
    const err: any = new Error('err')
    err.code = 'ENOENT'

    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(err, null)

    return expect(git.exec(['remote'])).to.throw(Error, 'Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
  })

  it.skip('exec passes through all other errors', function () {
    const err = new Error('Some other error message')

    mock.expects('execFile').withArgs('git', ['remote']).yieldsAsync(err, null)

    return expect(git.exec(['remote'])).to.throw(err.message)
  })

  it.skip('runs spawn', function () {
    const emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('close'))
    return git.spawn(['remote'])
      .then(() => mock.verify())
  })

  it.skip('translates spawn Errno::ENOENT to a friendlier error message', function () {
    const err = new Error('err')
    err.name = 'ENOENT'

    const emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('error', err))

    return expect(git.spawn(['remote'])).to.throw('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
  })

  it.skip('spawn passes through all other errors', function () {
    const err = new Error('Some other error message')

    const emitter = new EventEmitter()
    mock.expects('spawn').withExactArgs('git', ['remote'], {stdio: [0, 1, 2]}).returns(emitter)
    process.nextTick(() => emitter.emit('error', err))

    return expect(git.spawn(['remote'])).to.throw(err.message)
  })

  it.skip('gets heroku git remote config', function () {
    mock.expects('execFile').withArgs('git', ['config', 'heroku.remote']).yieldsAsync(null, 'staging')
    return git.remoteFromGitConfig()
      .then((remote: string | void) => expect(remote).to.equal('staging'))
      .then(() => mock.verify())
  })

  it.skip('returns an http git url', function () {
    expect(git.url('foo')).to.equal('https://git.heroku.com/foo.git')
  })

  it.skip('returns an ssh git url', function () {
    expect(git.url('foo')).to.equal('git@heroku.com:foo.git')
  })
})
