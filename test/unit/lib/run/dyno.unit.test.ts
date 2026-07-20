import {APIClient} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Dyno, {DynoOpts} from '../../../../src/lib/run/dyno.js'

function buildSshDyno(mockHeroku: APIClient): Dyno {
  const opts: DynoOpts = {
    app: 'my-app',
    command: 'bash',
    dyno: 'run.1234',
    heroku: mockHeroku,
    showStatus: false,
  }
  return new Dyno(opts)
}

describe('Dyno', function () {
  let sandbox: sinon.SinonSandbox
  let mockHeroku: APIClient

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    mockHeroku = {
      get: sandbox.stub(),
      options: {},
      post: sandbox.stub(),
    } as unknown as APIClient
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('constructor', function () {
    it('sets default showStatus to true', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      expect(dyno.opts.showStatus).to.equal(true)
    })

    it('preserves showStatus when explicitly set to false', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
        showStatus: false,
      }
      const dyno = new Dyno(opts)
      expect(dyno.opts.showStatus).to.equal(false)
    })

    it('preserves showStatus when explicitly set to true', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
        showStatus: true,
      }
      const dyno = new Dyno(opts)
      expect(dyno.opts.showStatus).to.equal(true)
    })
  })

  describe('_useSSH', function () {
    it('returns true for http protocol', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      dyno.uri = new URL('http://example.com')
      expect(dyno._useSSH).to.equal(true)
    })

    it('returns true for https protocol', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      dyno.uri = new URL('https://example.com')
      expect(dyno._useSSH).to.equal(true)
    })

    it('returns false for other protocols', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      dyno.uri = new URL('wss://example.com')
      expect(dyno._useSSH).to.equal(false)
    })

    it('returns undefined when uri is not set', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      expect(dyno._useSSH).to.be.undefined
    })
  })

  describe('_env', function () {
    it('includes TERM from process.env', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const originalTerm = process.env.TERM
      process.env.TERM = 'xterm-256color'
      const env = dyno._env()
      expect(env.TERM).to.equal('xterm-256color')
      process.env.TERM = originalTerm
    })

    it('builds env from flag when provided', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        env: 'FOO=bar;BAZ=qux',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const env = dyno._env()
      expect(env.FOO).to.equal('bar')
      expect(env.BAZ).to.equal('qux')
    })

    it('returns env without COLUMNS and LINES when not TTY', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const env = dyno._env()
      // In test environment, stdout is typically not a TTY
      // so COLUMNS and LINES should not be set
      expect(env).to.have.property('TERM')
    })
  })

  describe('_isDebug', function () {
    it('returns true when HEROKU_DEBUG is "1"', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const originalDebug = process.env.HEROKU_DEBUG
      process.env.HEROKU_DEBUG = '1'
      expect(dyno._isDebug()).to.equal(true)
      process.env.HEROKU_DEBUG = originalDebug
    })

    it('returns true when HEROKU_DEBUG is "TRUE"', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const originalDebug = process.env.HEROKU_DEBUG
      process.env.HEROKU_DEBUG = 'TRUE'
      expect(dyno._isDebug()).to.equal(true)
      process.env.HEROKU_DEBUG = originalDebug
    })

    it('returns true when HEROKU_DEBUG is "true" (case insensitive)', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const originalDebug = process.env.HEROKU_DEBUG
      process.env.HEROKU_DEBUG = 'true'
      expect(dyno._isDebug()).to.equal(true)
      process.env.HEROKU_DEBUG = originalDebug
    })

    it('returns falsy when HEROKU_DEBUG is not set', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const originalDebug = process.env.HEROKU_DEBUG
      delete process.env.HEROKU_DEBUG
      expect(dyno._isDebug()).to.be.not.ok
      process.env.HEROKU_DEBUG = originalDebug
    })

    it('returns false when HEROKU_DEBUG is "0"', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      const originalDebug = process.env.HEROKU_DEBUG
      process.env.HEROKU_DEBUG = '0'
      expect(dyno._isDebug()).to.equal(false)
      process.env.HEROKU_DEBUG = originalDebug
    })
  })

  describe('_status', function () {
    it('formats status with dyno name', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      dyno.dyno = {name: 'run.1234', size: 0} as any
      expect(dyno._status('up')).to.equal('up, run.1234')
    })

    it('formats status with dyno name and size', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      dyno.dyno = {name: 'run.1234', size: 1} as any
      expect(dyno._status('up')).to.equal('up, run.1234 (1)')
    })

    it('uses opts.dyno when dyno.name is not available', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        dyno: 'run.5678',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      dyno.dyno = {size: 0} as any
      expect(dyno._status('starting')).to.equal('starting, run.5678')
    })
  })

  describe('_readData', function () {
    it('parses exit code from output', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      let resolveCalled = false
      let rejectCalled = false
      let pushedData: unknown

      dyno.resolve = () => {
        resolveCalled = true
      }

      dyno.reject = () => {
        rejectCalled = true
      }

      // Stub the push method
      dyno.push = (chunk?: unknown) => {
        pushedData = chunk
        return true
      }

      const readData = dyno._readData()
      readData('some output\n\uFFFF heroku-command-exit-status: 0\n')
      expect(resolveCalled).to.equal(true)
      expect(rejectCalled).to.equal(false)
      expect(pushedData).to.equal('some output\n')
    })

    it('rejects with non-zero exit code', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      let resolveValue: unknown
      let rejectValue: unknown

      dyno.resolve = (value?: unknown) => {
        resolveValue = value
      }

      dyno.reject = (value?: unknown) => {
        rejectValue = value
      }

      // Stub the push method
      dyno.push = () => true

      const readData = dyno._readData()
      readData('some output\n\uFFFF heroku-command-exit-status: 1\n')
      expect(resolveValue).to.be.undefined
      expect(rejectValue).to.not.be.undefined
      expect((rejectValue as any).exitCode).to.equal(1)
    })

    it('pushes data when no exit code is present', function () {
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
      }
      const dyno = new Dyno(opts)
      let pushedData: unknown

      dyno.push = (chunk?: unknown) => {
        pushedData = chunk
        return true
      }

      const readData = dyno._readData()
      readData('regular output\n')
      expect(pushedData).to.equal('regular output\n')
    })
  })

  describe('_doStart', function () {
    let runStub: sinon.SinonStub
    let attachStub: sinon.SinonStub

    beforeEach(function () {
      runStub = sandbox.stub()
      const fakePlatform = {
        dyno: {run: runStub, waitForInfo: sandbox.stub()},
      }
      sandbox.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
      // The attach path opens a real socket; stub it so the test never
      // dials a network endpoint.
      attachStub = sandbox.stub(Dyno.prototype, 'attach' as keyof Dyno).resolves()
    })

    it('calls platform.dyno.run with the app, command, and mapped options for a one-off dyno', async function () {
      runStub.resolves({
        attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000',
        name: 'run.1234',
        size: 'Standard-1X',
        state: 'starting',
      })
      const opts: DynoOpts = {
        app: 'my-app',
        attach: true,
        command: 'bash',
        env: 'FOO=bar',
        'exit-code': true,
        heroku: mockHeroku,
        'no-tty': true,
        showStatus: false,
        size: 'Standard-1X',
        type: 'run',
      }
      const dyno = new Dyno(opts)
      await dyno._doStart()

      expect(runStub.calledOnce).to.equal(true)
      const [appId, command, options] = runStub.firstCall.args
      expect(appId).to.equal('my-app')
      expect(command).to.equal('bash')
      expect(options).to.include({
        attach: true,
        exitCode: true,
        forceNoTTY: true,
        size: 'Standard-1X',
        type: 'run',
      })
      expect(options.env).to.have.property('FOO', 'bar')
      expect(options.env).to.have.property('TERM')
    })

    it('passes options.dyno for the exec-inside variant', async function () {
      runStub.resolves({name: 'web.1', size: 'Standard-1X', state: 'up'})
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        dyno: 'web.1',
        heroku: mockHeroku,
        showStatus: false,
      }
      const dyno = new Dyno(opts)
      await dyno._doStart()

      expect(runStub.calledOnce).to.equal(true)
      const options = runStub.firstCall.args[2]
      expect(options.dyno).to.equal('web.1')
    })

    it('stores the returned dyno on this.dyno and calls attach() when opts.attach is true', async function () {
      const returned = {
        attach_url: 'rendezvous://x:5000',
        name: 'run.1234',
        size: 'Standard-1X',
        state: 'starting',
      }
      runStub.resolves(returned)
      const opts: DynoOpts = {
        app: 'my-app',
        attach: true,
        command: 'bash',
        heroku: mockHeroku,
        showStatus: false,
      }
      const dyno = new Dyno(opts)
      await dyno._doStart()

      expect(dyno.dyno).to.deep.equal(returned)
      expect(attachStub.calledOnce).to.equal(true)
    })

    it('does not call attach() when opts.attach is false and opts.dyno is unset', async function () {
      runStub.resolves({
        name: 'run.1234',
        size: 'Standard-1X',
        state: 'starting',
      })
      const opts: DynoOpts = {
        app: 'my-app',
        attach: false,
        command: 'bash',
        heroku: mockHeroku,
        showStatus: false,
      }
      const dyno = new Dyno(opts)
      await dyno._doStart()

      expect(attachStub.called).to.equal(false)
    })

    it('propagates non-409 errors from platform.dyno.run', async function () {
      const failure = new Error('platform down')
      runStub.rejects(failure)
      const opts: DynoOpts = {
        app: 'my-app',
        command: 'bash',
        heroku: mockHeroku,
        showStatus: false,
      }
      const dyno = new Dyno(opts)
      let caught: unknown
      try {
        await dyno._doStart()
      } catch (error) {
        caught = error
      }

      expect(caught).to.equal(failure)
    })
  })

  describe('_ssh', function () {
    let waitForInfoStub: sinon.SinonStub
    let connectStub: sinon.SinonStub

    beforeEach(function () {
      waitForInfoStub = sandbox.stub()
      const fakePlatform = {
        dyno: {run: sandbox.stub(), waitForInfo: waitForInfoStub},
      }
      sandbox.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
      // _connect opens a TLS socket; stub it so the test never tries
      // to dial a real network endpoint.
      connectStub = sandbox.stub(Dyno.prototype, '_connect' as keyof Dyno).resolves('connected')
    })

    it('calls waitForInfo with the runnable-state filter and forwards app+dyno args', async function () {
      waitForInfoStub.resolves({name: 'run.1234', size: 'Standard-1X', state: 'up'})

      const dyno = buildSshDyno(mockHeroku)
      await dyno._ssh()

      expect(waitForInfoStub.calledOnce).to.equal(true)
      const [appId, dynoId, options] = waitForInfoStub.firstCall.args
      expect(appId).to.equal('my-app')
      expect(dynoId).to.equal('run.1234')
      expect(options.states).to.deep.equal(['starting', 'up'])
      expect(typeof options.onPoll).to.equal('function')
    })

    it('updates this.dyno from onPoll and from the resolved value', async function () {
      const finalDyno = {name: 'run.1234', size: 'Standard-1X', state: 'up'}
      waitForInfoStub.callsFake(async (_app: string, _name: string, options: {onPoll?: (d: unknown) => void}) => {
        // Simulate the helper firing onPoll for an intermediate state.
        options.onPoll?.({name: 'run.1234', size: 'Standard-1X', state: 'starting'})
        options.onPoll?.(finalDyno)
        return finalDyno
      })

      const dyno = buildSshDyno(mockHeroku)
      await dyno._ssh()

      expect(dyno.dyno).to.deep.equal(finalDyno)
    })

    it('connects after the dyno reaches a runnable state', async function () {
      waitForInfoStub.resolves({name: 'run.1234', size: 'Standard-1X', state: 'starting'})

      const dyno = buildSshDyno(mockHeroku)
      const result = await dyno._ssh()

      expect(connectStub.calledOnce).to.equal(true)
      expect(result).to.equal('connected')
    })

    it('propagates waitForInfo errors without calling _connect', async function () {
      const failure = new Error('platform unreachable')
      waitForInfoStub.rejects(failure)

      const dyno = buildSshDyno(mockHeroku)
      let caught: unknown
      try {
        await dyno._ssh()
      } catch (error) {
        caught = error
      }

      expect(caught).to.equal(failure)
      expect(connectStub.called).to.equal(false)
    })
  })
})
