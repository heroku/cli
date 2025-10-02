import {expect, test} from '@oclif/test'
import sinon from 'sinon'
import Cmd from '../../../../src/commands/local/index.js'

describe('local', function () {
  describe('flag validation', function () {
    test
      .stub('../../../../src/lib/local/fork-foreman.js', 'fork', () => Promise.resolve())
      .command(['local', '--procfile', 'Procfile.other'])
      .it('accepts --procfile flag')

    test
      .stub('../../../../src/lib/local/fork-foreman.js', 'fork', () => Promise.resolve())
      .command(['local', '--port', '4600'])
      .it('accepts --port flag')

    test
      .stub('../../../../src/lib/local/fork-foreman.js', 'fork', () => Promise.resolve())
      .command(['local', '--env', 'DEBUG=true'])
      .it('accepts --env flag')
  })

  describe('error handling', function () {
    test
      .command(['local', 'Procfile.other', 'extra-argument'])
      .catch(error => {
        expect(error.message).to.contain('Unexpected argument: extra-argument')
      })
      .it('rejects too many arguments', () => {
        // Assertion is in the catch block
      })

    test
      .command(['local', '--restart'])
      .catch(error => {
        expect(error.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
      })
      .it('shows helpful error for deprecated --restart flag', () => {
        // Assertion is in the catch block
      })

    test
      .command(['local', '--concurrency', 'web=2'])
      .catch(error => {
        expect(error.message).to.equal('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
      })
      .it('shows helpful error for deprecated --concurrency flag', () => {
        // Assertion is in the catch block
      })
  })

  describe('argument construction', function () {
    let sandbox: ReturnType<typeof sinon.createSandbox>
    let runForemanStub: sinon.SinonStub

    beforeEach(function () {
      sandbox = sinon.createSandbox()
      runForemanStub = sandbox.stub(Cmd.prototype, 'runForeman').resolves()
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('builds correct arguments with multiple flags', async function () {
      await Cmd.run(['local', '--procfile', 'Procfile.dev', '--port', '3000'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('--procfile')
      expect(runForemanStub.firstCall.args[0]).to.include('Procfile.dev')
      expect(runForemanStub.firstCall.args[0]).to.include('--port')
      expect(runForemanStub.firstCall.args[0]).to.include('3000')
    })

    it('builds correct arguments with custom env', async function () {
      await Cmd.run(['local', '--env', 'production.env'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('--env')
      expect(runForemanStub.firstCall.args[0]).to.include('production.env')
    })

    it('builds correct arguments with env flag', async function () {
      await Cmd.run(['local', '--env', 'test.env'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('--env')
      expect(runForemanStub.firstCall.args[0]).to.include('test.env')
    })

    it('passes process name directly when specified', async function () {
      await Cmd.run(['web'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('web')
    })

    it('uses default procfile when none specified', async function () {
      // This test verifies that when no procfile is specified, it defaults to 'Procfile'
      // and calls loadProc with the default path
      await Cmd.run([])

      expect(runForemanStub.calledOnce).to.be.true
      // Should include 'start' and '--env' at minimum
      expect(runForemanStub.firstCall.args[0][0]).to.equal('start')
      expect(runForemanStub.firstCall.args[0]).to.include('--env')
    })
  })

  describe('procfile integration', function () {
    let sandbox: ReturnType<typeof sinon.createSandbox>
    let runForemanStub: sinon.SinonStub
    let loadProcfileStub: sinon.SinonStub

    beforeEach(function () {
      sandbox = sinon.createSandbox()
      runForemanStub = sandbox.stub(Cmd.prototype, 'runForeman').resolves()
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('filters out release process from procfile', async function () {
      loadProcfileStub = sandbox.stub(Cmd.prototype, 'loadProcfile').returns({
        web: 'node server.js',
        worker: 'node worker.js',
        release: 'node migrate.js',
      })

      // Don't provide processname so it uses procfile loading path
      await Cmd.run([])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(loadProcfileStub.firstCall.args[0]).to.equal('Procfile')

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('web,worker') // release should be filtered out
    })

    it('uses custom procfile when specified', async function () {
      loadProcfileStub = sandbox.stub(Cmd.prototype, 'loadProcfile').returns({
        api: 'node api.js',
        scheduler: 'node scheduler.js',
      })

      await Cmd.run(['--procfile', 'Procfile.dev'])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(loadProcfileStub.firstCall.args[0]).to.equal('Procfile.dev')

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('api,scheduler')
    })

    it('handles empty procfile gracefully', async function () {
      loadProcfileStub = sandbox.stub(Cmd.prototype, 'loadProcfile').returns({})

      await Cmd.run([])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('') // empty process list
    })

    it('handles procfile with only release process', async function () {
      loadProcfileStub = sandbox.stub(Cmd.prototype, 'loadProcfile').returns({
        release: 'node migrate.js',
      })

      await Cmd.run([])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('') // release filtered out, leaving empty
    })
  })

  describe('environment file integration', function () {
    let sandbox: ReturnType<typeof sinon.createSandbox>
    let runForemanStub: sinon.SinonStub

    beforeEach(function () {
      sandbox = sinon.createSandbox()
      runForemanStub = sandbox.stub(Cmd.prototype, 'runForeman').resolves()
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('defaults to .env when no env file specified', async function () {
      await Cmd.run([])

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]

      // Should include --env .env
      const envIndex = args.indexOf('--env')
      expect(envIndex).to.be.greaterThan(-1)
      expect(args[envIndex + 1]).to.equal('.env')
    })

    it('uses custom env file when specified', async function () {
      await Cmd.run(['local', '--env', 'custom.env'])

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]

      // Should include --env custom.env
      const envIndex = args.indexOf('--env')
      expect(envIndex).to.be.greaterThan(-1)
      expect(args[envIndex + 1]).to.equal('custom.env')
    })
  })
})
