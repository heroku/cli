import {expect} from 'chai'
import cp from 'node:child_process'
import {EventEmitter} from 'node:events'
import {SinonStub, stub} from 'sinon'

import Git from '../../../../src/lib/git/git.js'

describe('git', function () {
  let execFileStub: SinonStub
  let spawnStub: SinonStub
  let git: Git

  beforeEach(function () {
    git = new Git()
    execFileStub = stub(git as any, 'execFile')
    spawnStub = stub(cp, 'spawn')
  })

  afterEach(function () {
    execFileStub.restore()
    spawnStub.restore()
  })

  it('runs exec', async function () {
    execFileStub.resolves({stderr: '', stdout: 'foo'})

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
    execFileStub.resolves({stderr: '', stdout: 'staging'})

    const remote = await git.remoteFromGitConfig()

    expect(remote).to.equal('staging')
    expect(execFileStub.calledOnceWith('git', ['config', 'heroku.remote'])).to.be.true
  })

  it('returns an https git url', function () {
    expect(git.url('foo')).to.equal('https://git.heroku.com/foo.git')
  })

  it('configures git credential helper globally when the key is absent', async function () {
    // `git config --global --get` exits non-zero when the key is absent, so
    // `exec` throws and the helper treats it as an empty existing value.
    const err: any = new Error('not found')
    err.code = 1
    execFileStub.onFirstCall().rejects(err)
    execFileStub.resolves({stderr: '', stdout: ''})

    await git.configureCredentialHelper()

    expect(execFileStub.calledTwice).to.be.true
    expect(execFileStub.firstCall.args).to.deep.equal(['git', ['config', '--global', '--get', 'credential.https://git.heroku.com.helper']])
    const [cmd, args] = execFileStub.secondCall.args
    expect(cmd).to.equal('git')
    expect(args).to.deep.equal(['config', '--global', 'credential.https://git.heroku.com.helper', '!heroku git:credentials'])
  })

  it('overwrites the git credential helper when it is set to a different value', async function () {
    execFileStub.onFirstCall().resolves({stderr: '', stdout: '!some-other-helper'})
    execFileStub.resolves({stderr: '', stdout: ''})

    await git.configureCredentialHelper()

    expect(execFileStub.calledTwice).to.be.true
    expect(execFileStub.firstCall.args).to.deep.equal(['git', ['config', '--global', '--get', 'credential.https://git.heroku.com.helper']])
    const [cmd, args] = execFileStub.secondCall.args
    expect(cmd).to.equal('git')
    expect(args).to.deep.equal(['config', '--global', 'credential.https://git.heroku.com.helper', '!heroku git:credentials'])
  })

  it('skips the write when the git credential helper is already configured', async function () {
    execFileStub.resolves({stderr: '', stdout: '!heroku git:credentials'})

    await git.configureCredentialHelper()

    expect(execFileStub.calledOnce).to.be.true
    const [cmd, args] = execFileStub.firstCall.args
    expect(cmd).to.equal('git')
    expect(args).to.deep.equal(['config', '--global', '--get', 'credential.https://git.heroku.com.helper'])
  })

  it('removes git credential helper from global config', async function () {
    execFileStub.resolves({stderr: '', stdout: ''})

    await git.removeCredentialHelper()

    expect(execFileStub.calledOnce).to.be.true
    const [cmd, args] = execFileStub.firstCall.args
    expect(cmd).to.equal('git')
    expect(args).to.deep.equal(['config', '--global', '--unset-all', 'credential.https://git.heroku.com.helper'])
  })

  it('erases stored credentials for the Heroku Git host', async function () {
    const emitter = new EventEmitter() as any
    emitter.stdin = {end: stub(), write: stub()}
    spawnStub.returns(emitter)

    const erasePromise = git.eraseCredentials()

    process.nextTick(() => emitter.emit('close', 0))

    await erasePromise

    expect(spawnStub.calledOnceWith('git', ['credential', 'reject'], {stdio: ['pipe', 'ignore', 'ignore']})).to.be.true
    expect(emitter.stdin.write.calledOnceWith('protocol=https\nhost=git.heroku.com\n\n')).to.be.true
    expect(emitter.stdin.end.calledOnce).to.be.true
  })
})
