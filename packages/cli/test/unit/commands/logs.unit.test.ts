import {expect} from 'chai'
import * as proxyquire from 'proxyquire'
import * as sinon from 'sinon'
import runCommand, {GenericCmd} from '../../helpers/runCommand'
import {CLIError} from '@oclif/core/lib/errors'

describe('logs', function () {
  let logDisplayerStub: sinon.SinonStub
  let Cmd: GenericCmd

  beforeEach(async function () {
    logDisplayerStub = sinon.stub()
    Cmd = proxyquire(
      '../../../src/commands/logs',
      {
        '../lib/run/log-displayer': {
          default: logDisplayerStub,
        },
      },
    ).default
  })

  afterEach(function () {
    sinon.restore()
  })

  context('without --num option', function () {
    it('calls logDisplayer function with the default number of lines (100)', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })).to.be.true
    })
  })

  context('with --num option', function () {
    it('calls logDisplayer function with the specified number of lines', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--num=20',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 20,
        source: undefined,
        tail: false,
        type: undefined,
      })).to.be.true
    })
  })

  context('with --dyno option', function () {
    it('calls logDisplayer function with dyno filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--dyno=web.2',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: 'web.2',
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })).to.be.true
    })
  })

  context('with --type option', function () {
    it('calls logDisplayer function with type filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--type=web',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: 'web',
      })).to.be.true
    })
  })

  context('with --ps option', function () {
    it('calls logDisplayer function with type filter set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--ps=web',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: 'web',
      })).to.be.true
    })
  })

  context('with both --dyno and --ps options', function () {
    it('shows an error and doesn’t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--dyno=web.1',
          '--ps=worker',
        ])
      } catch (error: unknown) {
        const {message} = error as CLIError
        expect(message).to.include('--dyno=web.1 cannot also be provided when using --ps')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })

  context('with both --dyno and --type options', function () {
    it('shows an error and doesn’t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--dyno=web.1',
          '--type=worker',
        ])
      } catch (error: unknown) {
        const {message} = error as CLIError
        expect(message).to.include('--dyno=web.1 cannot also be provided when using --type')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })

  context('with both --ps and --type options', function () {
    it('shows an error and doesn’t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--ps=web',
          '--type=worker',
        ])
      } catch (error: unknown) {
        const {message} = error as CLIError
        expect(message).to.include('--ps=web cannot also be provided when using --type')
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

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: 'heroku',
        tail: false,
        type: undefined,
      })).to.be.true
    })
  })

  context('with --tail flag', function () {
    it('calls logDisplayer function with tail flag set', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--tail',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: true,
        type: undefined,
      })).to.be.true
    })
  })

  context('with --force-colors flag', function () {
    it('accepts the flag with no effect on the logDisplayer call arguments', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--force-colors',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })).to.be.true
    })
  })

  context('with --no-color flag', function () {
    it('accepts the flag with no effect on the logDisplayer call arguments', async function () {
      await runCommand(Cmd, [
        '--app=my-app',
        '--no-color',
      ])

      expect(logDisplayerStub.calledWith(sinon.match.any, {
        app: 'my-app',
        dyno: undefined,
        lines: 100,
        source: undefined,
        tail: false,
        type: undefined,
      })).to.be.true
    })
  })

  context('with both --force-colors and --no-color flag', function () {
    it('shows an error and doesn’t call logDisplayer function', async function () {
      try {
        await runCommand(Cmd, [
          '--app=my-app',
          '--force-colors',
          '--no-color',
        ])
      } catch (error: unknown) {
        const {message} = error as CLIError
        expect(message).to.include('--force-colors=true cannot also be provided when using --no-color')
      }

      expect(logDisplayerStub.notCalled).to.be.true
    })
  })
})
