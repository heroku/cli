import {expect} from 'chai'
import cp from 'node:child_process'
import {EventEmitter} from 'node:events'
import {SinonStub, stub} from 'sinon'

import {listRemotes} from '../../../../src/lib/ci/git.js'

// Builds a fake ChildProcess mirroring what `runGit` reads from a spawned git:
// `git.stdout.on('data', ...)`, the `exit` event, and `git.stderr.read()` on a
// non-zero exit. Emit the failure with `failWith` *after* the caller has been
// invoked, so `runGit`'s `exit` listener is attached first.
function fakeGit() {
  const child = new EventEmitter() as any
  child.stdout = new EventEmitter()
  child.failWith = (stderr: string) => {
    child.stderr = {read: () => Buffer.from(stderr)}
    process.nextTick(() => child.emit('exit', 1))
  }

  return child
}

describe('ci/git', function () {
  let spawnStub: SinonStub

  beforeEach(function () {
    spawnStub = stub(cp, 'spawn')
  })

  afterEach(function () {
    spawnStub.restore()
  })

  // Regression: these error paths used to `reject` a plain string. oclif's
  // error handler runs `'name' in err` while pretty-printing, which throws a
  // TypeError on a string primitive — the TypeError is swallowed and the user
  // sees `undefined` instead of the intended message. Rejecting with an Error
  // instance keeps the message in the output. (heroku/cli#1695)
  it('rejects with an Error (not a string) when not in a git repository', async function () {
    const child = fakeGit()
    spawnStub.returns(child)

    const promise = listRemotes()
    child.failWith('fatal: not a git repository (or any of the parent directories): .git')

    try {
      await promise
      expect.fail('expected listRemotes to reject')
    } catch (error: unknown) {
      expect(error).to.be.an.instanceOf(Error)
      expect((error as Error).message).to.equal('Please run this command from the directory containing your project\'s git repo')
    }
  })

  it('rejects with an Error (not a string) when HEAD is not on a branch', async function () {
    const child = fakeGit()
    spawnStub.returns(child)

    const promise = listRemotes()
    child.failWith('fatal: ref HEAD is not a symbolic ref')

    try {
      await promise
      expect.fail('expected listRemotes to reject')
    } catch (error: unknown) {
      expect(error).to.be.an.instanceOf(Error)
      expect((error as Error).message).to.equal('Please checkout a branch before running this command')
    }
  })

  it('rejects with an Error carrying the git output for other failures', async function () {
    const child = fakeGit()
    spawnStub.returns(child)

    const promise = listRemotes()
    child.failWith('fatal: some unexpected git failure')

    try {
      await promise
      expect.fail('expected listRemotes to reject')
    } catch (error: unknown) {
      expect(error).to.be.an.instanceOf(Error)
      expect((error as Error).message).to.contain('some unexpected git failure')
    }
  })
})
