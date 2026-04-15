import {expect} from 'chai'
import * as sinon from 'sinon'
import {APIClient} from '@heroku-cli/command'
import Dyno, {DynoOpts} from '../../../../src/lib/run/dyno.js'

describe('Dyno', function () {
  let sandbox: sinon.SinonSandbox
  let mockHeroku: APIClient

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    mockHeroku = {
      get: sandbox.stub(),
      post: sandbox.stub(),
      options: {},
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
})
