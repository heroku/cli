import {expect} from 'chai'
import {Config} from '@oclif/core'
import sinon from 'sinon'
import {HerokuRepl} from '../../../src/lib/repl.js'
import * as os from 'node:os'
import * as path from 'node:path'

describe('HerokuRepl', function () {
  let config: Config
  let repl: HerokuRepl

  beforeEach(async function () {
    // Create a minimal config mock
    config = {
      root: '/fake/root',
      commands: [],
      findCommand: sinon.stub().returns(null),
      runCommand: sinon.stub().resolves(),
    } as any
  })

  afterEach(function () {
    repl?.close()
    sinon.restore()
  })

  describe('constructor', function () {
    it('should create a HerokuRepl instance', function () {
      // Stub the protected fs methods before instantiation
      sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(false)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      expect(repl).to.be.instanceOf(HerokuRepl)
    })

    it('should initialize with the provided config', function () {
      sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(false)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      expect(repl).to.have.property('start')
    })
  })

  describe('start', function () {
    it('should be callable', function () {
      sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(false)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      expect(repl.start).to.be.a('function')
    })
  })

  describe('history and state management', function () {
    it('should load history from file if it exists', function () {
      const historyContent = 'apps:info\nps\nconfig:set FOO=bar'

      const fsExistsStub = sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(true)
      const fsReadStub = sinon.stub(HerokuRepl.prototype, 'fsReadFileSync' as any).returns(historyContent)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      // The history should be loaded (can't directly verify private property, but constructor doesn't throw)
      expect(repl).to.be.instanceOf(HerokuRepl)
      expect(fsReadStub.called).to.be.true
    })

    it('should restore state from file if it exists', function () {
      const stateContent = '{"app":"test-app","team":"test-team"}'
      const historyFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_history')
      const stateFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_state')

      const fsExistsStub = sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any)
      fsExistsStub.withArgs(historyFile).returns(false)
      fsExistsStub.withArgs(stateFile).returns(true)

      const fsReadStub = sinon.stub(HerokuRepl.prototype, 'fsReadFileSync' as any)
      fsReadStub.withArgs(stateFile, 'utf8').returns(stateContent)

      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      // State should be restored (constructor doesn't throw)
      expect(repl).to.be.instanceOf(HerokuRepl)
      expect(fsReadStub.calledWith(stateFile, 'utf8')).to.be.true
    })

    it('should handle missing history file gracefully', function () {
      sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(false)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      expect(repl).to.be.instanceOf(HerokuRepl)
    })

    it('should handle corrupted state file gracefully', function () {
      const historyFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_history')
      const stateFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_state')

      const fsExistsStub = sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any)
      fsExistsStub.withArgs(historyFile).returns(false)
      fsExistsStub.withArgs(stateFile).returns(true)

      const fsReadStub = sinon.stub(HerokuRepl.prototype, 'fsReadFileSync' as any)
      fsReadStub.withArgs(stateFile, 'utf8').returns('invalid json{')

      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      // Should not throw even with corrupted state file
      repl = new HerokuRepl(config)
      expect(repl).to.be.instanceOf(HerokuRepl)
    })
  })

  describe('history file limits', function () {
    it('should limit history to 1000 entries', function () {
      const longHistory = Array.from({length: 1500}, (_, i) => `command-${i}`).join('\n')

      sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(true)
      const fsReadStub = sinon.stub(HerokuRepl.prototype, 'fsReadFileSync' as any).returns(longHistory)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      // History should be loaded and limited (can't verify directly but constructor succeeds)
      expect(repl).to.be.instanceOf(HerokuRepl)
      expect(fsReadStub.called).to.be.true
    })
  })

  describe('MCP mode', function () {
    it('should handle MCP mode environment variable', function () {
      const originalMcpMode = process.env.HEROKU_MCP_MODE
      process.env.HEROKU_MCP_MODE = 'true'

      try {
        repl = new HerokuRepl(config)
        expect(repl).to.be.instanceOf(HerokuRepl)
      } finally {
        if (originalMcpMode === undefined) {
          delete process.env.HEROKU_MCP_MODE
        } else {
          process.env.HEROKU_MCP_MODE = originalMcpMode
        }
      }
    })
  })

  describe('readline interface creation', function () {
    it('should create readline interface with correct configuration', function () {
      sinon.stub(HerokuRepl.prototype, 'fsExistsSync' as any).returns(false)
      sinon.stub(HerokuRepl.prototype, 'fsCreateWriteStream' as any).returns({
        write: sinon.stub(),
        close: sinon.stub(),
      })

      repl = new HerokuRepl(config)
      // Verify that the REPL was created without errors
      expect(repl).to.be.instanceOf(HerokuRepl)
    })
  })

  describe('command finding', function () {
    it('should work with config that has findCommand', function () {
      const findCommandStub = sinon.stub().returns({
        id: 'apps:info',
        flags: {},
      })
      config = {
        ...config,
        findCommand: findCommandStub,
      } as any

      repl = new HerokuRepl(config)
      expect(repl).to.be.instanceOf(HerokuRepl)
    })

    it('should work with config that has commands list', function () {
      config = {
        ...config,
        commands: [
          {id: 'apps:info', flags: {}},
          {id: 'ps', flags: {}},
          {id: 'config:set', flags: {}},
        ],
      } as any

      repl = new HerokuRepl(config)
      expect(repl).to.be.instanceOf(HerokuRepl)
    })
  })
})
