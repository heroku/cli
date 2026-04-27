'use strict'

import sinon from 'sinon'
import {expect} from 'chai'
import cp from 'node:child_process'
import {EventEmitter} from 'events'
import Git from '../../../../src/lib/git/git.js'

describe('git', function () {
  let execFileStub: sinon.SinonStub
  let spawnStub: sinon.SinonStub
  let git: Git

  beforeEach(function () {
    git = new Git()
    execFileStub = sinon.stub(git as any, 'execFile')
    spawnStub = sinon.stub(cp, 'spawn')
  })

  afterEach(function () {
    execFileStub.restore()
    spawnStub.restore()
  })

  it('runs exec', async function () {
    execFileStub.resolves({stdout: 'foo', stderr: ''})

    const data = await git.exec(['remote'])

    expect(data).to.equal('foo')
    expect(execFileStub.calledOnceWith('git', ['remote'])).to.be.true
  })

  it('translates exec Errno::ENOENT to a friendlier error message', async function () {
    const err: any = new Error('err')
    err.code = 'ENOENT'

    execFileStub.rejects(err)

    try {
      await git.exec(['remote'])
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).to.contain('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
    }
  })

  it('exec passes through all other errors', async function () {
    const err = new Error('Some other error message')

    execFileStub.rejects(err)

    try {
      await git.exec(['remote'])
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).to.equal('Some other error message')
    }
  })

  it('runs spawn', async function () {
    const emitter = new EventEmitter()
    spawnStub.returns(emitter)

    const spawnPromise = git.spawn(['remote'])

    process.nextTick(() => emitter.emit('close', 0))

    await spawnPromise
    expect(spawnStub.calledOnceWith('git', ['remote'], {stdio: [0, 1, 2]})).to.be.true
  })

  it('translates spawn Errno::ENOENT to a friendlier error message', async function () {
    const err: any = new Error('err')
    err.code = 'ENOENT'

    const emitter = new EventEmitter()
    spawnStub.returns(emitter)

    const spawnPromise = git.spawn(['remote'])

    process.nextTick(() => emitter.emit('error', err))

    try {
      await spawnPromise
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).to.contain('Git must be installed to use the Heroku CLI.  See instructions here: https://git-scm.com')
    }
  })

  it('spawn passes through all other errors', async function () {
    const err = new Error('Some other error message')

    const emitter = new EventEmitter()
    spawnStub.returns(emitter)

    const spawnPromise = git.spawn(['remote'])

    process.nextTick(() => emitter.emit('error', err))

    try {
      await spawnPromise
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.message).to.equal('Some other error message')
    }
  })

  it('gets heroku git remote config', async function () {
    execFileStub.resolves({stdout: 'staging', stderr: ''})

    const remote = await git.remoteFromGitConfig()

    expect(remote).to.equal('staging')
    expect(execFileStub.calledOnceWith('git', ['config', 'heroku.remote'])).to.be.true
  })

  it('returns an https git url', function () {
    expect(git.url('foo')).to.equal('https://git.heroku.com/foo.git')
  })

  it('configures git credential helper globally for the Heroku Git host', async function () {
    execFileStub.resolves({stdout: '', stderr: ''})

    await git.configureCredentialHelper()

    expect(execFileStub.calledOnce).to.be.true
    const [cmd, args] = execFileStub.firstCall.args
    expect(cmd).to.equal('git')
    expect(args).to.deep.equal(['config', '--global', 'credential.https://git.heroku.com.helper', '!heroku git:credentials'])
  })
})
