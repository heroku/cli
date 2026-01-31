import {Errors} from '@oclif/core'
import {expect} from 'chai'
import sinon from 'sinon'

import Cmd from '../../../src/commands/logs.js'
import {LogDisplayer} from '../../../src/lib/run/log-displayer.js'
import runCommand from '../../helpers/runCommand.js'

describe('logs', function () {
  let logDisplayerStub: sinon.SinonStub

  beforeEach(async function () {
    // Stub only the display method
    logDisplayerStub = sinon.stub(LogDisplayer.prototype, 'display').resolves()
  })

  afterEach(function () {
    sinon.restore()
  })

  context('without --num option', function () {
    it('calls logDisplayer function with the default number of lines (100)', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })
    })
  })

  context('with --num option', function () {
    it('calls logDisplayer function with the specified number of lines', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--num=20',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 20,
        source: undefined,
        tail: false,
        type: undefined,
      })
    })
  })

  context('with --dyno-name option', function () {
    it('calls logDisplayer function with dyno filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--dyno-name=web.2',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: 'web.2',
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })
    })
  })

  context('with --type option', function () {
    it('calls logDisplayer function with type filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--process-type=web',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: 'web',
      })
    })
  })

  context('with --ps option', function () {
    it('calls logDisplayer function with type filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--ps=web',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: 'web',
      })
    })
  })

  context('with both --dyno-name and --ps options', function () {
    it('shows an error and doesn\'t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--dyno-name=web.1',
          '--ps=worker',
        ])
      } catch (error: unknown) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('--dyno-name=web.1 cannot also be provided when using --ps')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })

  context('with both --dyno-name and --type options', function () {
    it('shows an error and doesn\'t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--dyno-name=web.1',
          '--process-type=worker',
        ])
      } catch (error: unknown) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('--dyno-name=web.1 cannot also be provided when using --process-type')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })

  context('with both --ps and --type options', function () {
    it('shows an error and doesn\'t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--ps=web',
          '--process-type=worker',
        ])
      } catch (error: unknown) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('--ps=web cannot also be provided when using --process-type')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })

  context('with --source option', function () {
    it('calls logDisplayer function with source filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--source=heroku',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: 'heroku',
        tail: false,
        type: undefined,
      })
    })
  })

  context('with --tail flag', function () {
    it('calls logDisplayer function with tail flag set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--tail',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: true,
        type: undefined,
      })
    })
  })

  context('with --force-colors flag', function () {
    it('accepts the flag with no effect on the logDisplayer call arguments', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--force-colors',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })
    })
  })

  context('with --no-color flag', function () {
    it('accepts the flag with no effect on the logDisplayer call arguments', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--no-color',
      ])

      expect(logDisplayerStub.called).to.be.true

      // Verify display was called with correct parameters
      const displayCall = logDisplayerStub.getCall(0)
      expect(displayCall.args[0]).to.deep.equal({
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })
    })
  })

  context('with both --force-colors and --no-color flag', function () {
    it('shows an error and doesn\'t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--force-colors',
          '--no-color',
        ])
      } catch (error: unknown) {
        const {message} = error as Errors.CLIError
        expect(message).to.include('--force-colors=true cannot also be provided when using --no-color')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })
})
