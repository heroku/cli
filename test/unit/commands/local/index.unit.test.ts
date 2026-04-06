import {expect} from 'chai'
import sinon from 'sinon'

import Local from '../../../../src/commands/local/index.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('local', function () {
  let sandbox: ReturnType<typeof sinon.createSandbox>

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('flag validation', function () {
    it('accepts --procfile flag', async function () {
      const {error} = await runCommand(Local, ['--procfile', 'Procfile.other'])
      // If foreman runs, the flag was accepted
      if (error) {
        expect(error.message).to.not.contain('Invalid flag')
      }
    })

    it('accepts --port flag', async function () {
      const {error} = await runCommand(Local, ['--port', '4600'])
      // If foreman runs, the flag was accepted
      if (error) {
        expect(error.message).to.not.contain('Invalid flag')
      }
    })

    it('accepts --env flag', async function () {
      const {error} = await runCommand(Local, ['--env', 'DEBUG=true'])
      // If foreman runs, the flag was accepted
      if (error) {
        expect(error.message).to.not.contain('Invalid flag')
      }
    })

    it('accepts --start-cmd flag', async function () {
      sandbox.stub(Local.prototype, 'runForeman').resolves()
      sandbox.stub(Local.prototype, 'hasProcfile').returns(false)
      const {error} = await runCommand(Local, ['--start-cmd', 'npm start'])
      // If command parsing reaches execution, the flag was accepted
      if (error) {
        expect(error.message).to.not.contain('Invalid flag')
      }
    })
  })

  describe('error handling', function () {
    it('rejects too many arguments', async function () {
      const {error} = await runCommand(Local, ['Procfile.other', 'extra-argument'])
      expect(error?.message).to.contain('Unexpected argument: extra-argument')
    })

    it('shows helpful error for deprecated --restart flag', async function () {
      const {error} = await runCommand(Local, ['--restart'])
      expect(error?.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    })

    it('shows helpful error for deprecated --concurrency flag', async function () {
      const {error} = await runCommand(Local, ['--concurrency', 'web=2'])
      expect(error?.message).to.equal('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    })
  })

  describe('argument construction', function () {
    let runForemanStub: sinon.SinonStub
    let hasProcfileStub: sinon.SinonStub
    let loadProcfileStub: sinon.SinonStub
    let originalCwd: string

    beforeEach(function () {
      runForemanStub = sandbox.stub(Local.prototype, 'runForeman').resolves()
      hasProcfileStub = sandbox.stub(Local.prototype, 'hasProcfile').returns(true)
      loadProcfileStub = sandbox.stub(Local.prototype, 'loadProcfile').returns({web: 'npm start'})
      originalCwd = process.cwd()
    })

    afterEach(function () {
      process.chdir(originalCwd)
    })

    it('builds correct arguments with multiple flags', async function () {
      // await Cmd.run(['local', '--procfile', 'Procfile.dev', '--port', '3000'])
      await runCommand(Local, ['local', '--procfile', 'Procfile.dev', '--port', '3000'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('--procfile')
      expect(runForemanStub.firstCall.args[0]).to.include('Procfile.dev')
      expect(runForemanStub.firstCall.args[0]).to.include('--port')
      expect(runForemanStub.firstCall.args[0]).to.include('3000')
    })

    it('builds correct arguments with custom env', async function () {
      // await Cmd.run(['local', '--env', 'production.env'])
      await runCommand(Local, ['local', '--env', 'production.env'])
      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('--env')
      expect(runForemanStub.firstCall.args[0]).to.include('production.env')
    })

    it('builds correct arguments with env flag', async function () {
      // await Cmd.run(['local', '--env', 'test.env'])
      await runCommand(Local, ['local', '--env', 'test.env'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('--env')
      expect(runForemanStub.firstCall.args[0]).to.include('test.env')
    })

    it('passes process name directly when specified', async function () {
      await runCommand(Local, ['web'])
      // await Cmd.run(['web'])

      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.include('web')
    })

    it('uses default procfile when none specified', async function () {
      // Change to fixtures directory so the test can find the default Procfile
      process.chdir('test/fixtures/local')
      hasProcfileStub.restore()
      loadProcfileStub.restore()

      // This test verifies that when no procfile is specified, it defaults to 'Procfile'
      // and calls loadProc with the default path
      await runCommand(Local)

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
      runForemanStub = sandbox.stub(Local.prototype, 'runForeman').resolves()
      sandbox.stub(Local.prototype, 'hasProcfile').returns(true)
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('filters out release process from procfile', async function () {
      loadProcfileStub = sandbox.stub(Local.prototype, 'loadProcfile').returns({
        release: 'node migrate.js',
        web: 'node server.js',
        worker: 'node worker.js',
      })

      // Don't provide processname so it uses procfile loading path
      await runCommand(Local)

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(loadProcfileStub.firstCall.args[0]).to.equal('Procfile')

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('web,worker') // release should be filtered out
    })

    it('uses custom procfile when specified', async function () {
      loadProcfileStub = sandbox.stub(Local.prototype, 'loadProcfile').returns({
        api: 'node api.js',
        scheduler: 'node scheduler.js',
      })
      await runCommand(Local, ['--procfile', 'Procfile.dev'])
      // await Cmd.run(['--procfile', 'Procfile.dev'])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(loadProcfileStub.firstCall.args[0]).to.equal('Procfile.dev')

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('api,scheduler')
    })

    it('handles empty procfile gracefully', async function () {
      loadProcfileStub = sandbox.stub(Local.prototype, 'loadProcfile').returns({})

      await runCommand(Local)

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('') // empty process list
    })

    it('handles procfile with only release process', async function () {
      loadProcfileStub = sandbox.stub(Local.prototype, 'loadProcfile').returns({
        release: 'node migrate.js',
      })
      await runCommand(Local)

      // await Cmd.run([])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]
      const processArg = args.at(-1)
      expect(processArg).to.equal('') // release filtered out, leaving empty
    })
  })

  describe('start command precedence', function () {
    let runForemanStub: sinon.SinonStub
    let hasProcfileStub: sinon.SinonStub
    let loadProcfileStub: sinon.SinonStub

    beforeEach(function () {
      runForemanStub = sandbox.stub(Local.prototype, 'runForeman').resolves()
      hasProcfileStub = sandbox.stub(Local.prototype, 'hasProcfile').returns(true)
      loadProcfileStub = sandbox.stub(Local.prototype, 'loadProcfile').returns({web: 'node server.js'})
    })

    it('uses procfile and warns when both procfile and --start-cmd are provided', async function () {
      const {stderr} = await runCommand(Local, ['--start-cmd', 'npm start'])

      expect(loadProcfileStub.calledOnce).to.be.true
      expect(runForemanStub.calledOnce).to.be.true
      expect(stderr).to.contain('is being ignored')
    })

    it('uses --start-cmd when no procfile is found', async function () {
      hasProcfileStub.returns(false)
      await runCommand(Local, ['--start-cmd', 'python app.py'])

      expect(loadProcfileStub.called).to.be.false
      expect(runForemanStub.calledOnce).to.be.true
      expect(runForemanStub.firstCall.args[0]).to.deep.equal(['run', '--env', '.env', '--', 'sh', '-c', 'python app.py'])
    })

    it('errors when no procfile and no --start-cmd are provided', async function () {
      hasProcfileStub.returns(false)
      const {error} = await runCommand(Local)

      expect(error?.message).to.equal(
        'No Procfile found.\nAdd a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile\nOr specify a start command with --start-cmd.',
      )
      expect(runForemanStub.called).to.be.false
    })
  })

  describe('environment file integration', function () {
    let sandbox: ReturnType<typeof sinon.createSandbox>
    let runForemanStub: sinon.SinonStub
    let originalCwd: string

    beforeEach(function () {
      sandbox = sinon.createSandbox()
      runForemanStub = sandbox.stub(Local.prototype, 'runForeman').resolves()
      originalCwd = process.cwd()
    })

    afterEach(function () {
      sandbox.restore()
      process.chdir(originalCwd)
    })

    it('defaults to .env when no env file specified', async function () {
      // Change to fixtures directory so the test can find the default Procfile
      process.chdir('test/fixtures/local')
      await runCommand(Local)

      // await Cmd.run([])

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]

      // Should include --env .env
      const envIndex = args.indexOf('--env')
      expect(envIndex).to.be.greaterThan(-1)
      expect(args[envIndex + 1]).to.equal('.env')
    })

    it('uses custom env file when specified', async function () {
      // await Cmd.run(['local', '--env', 'custom.env'])
      await runCommand(Local, ['local', '--env', 'custom.env'])

      expect(runForemanStub.calledOnce).to.be.true
      const args = runForemanStub.firstCall.args[0]

      // Should include --env custom.env
      const envIndex = args.indexOf('--env')
      expect(envIndex).to.be.greaterThan(-1)
      expect(args[envIndex + 1]).to.equal('custom.env')
    })
  })
})
