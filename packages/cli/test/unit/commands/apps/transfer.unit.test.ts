import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import sinon from 'sinon'
import {expect} from 'chai'
import runCommand from '../../../helpers/runCommand.js'
import {apps, personalApp, teamApp} from '../../../helpers/stubs/get.js'
import {teamAppTransfer} from '../../../helpers/stubs/patch.js'
import {personalToPersonal} from '../../../helpers/stubs/post.js'
import Cmd from '../../../../src/commands/apps/transfer.js'
import stripAnsi from 'strip-ansi'

/*
describe('heroku apps:transfer', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    apps()
  })

  afterEach(function () {
    sandbox.restore()
    return nock.cleanAll()
  })

  context('when transferring in bulk', function () {
    it('transfers selected apps to a team', async function () {
      const promptStub = sandbox.stub().resolves({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      sandbox.stub(Cmd.prototype, 'getAppsToTransfer').callsFake(promptStub)

      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--bulk',
        'team',
      ])
      api.done()
      expect(stripAnsi(stderr.output)).to.include('Warning: Transferring applications to team...')
      expect(stripAnsi(stderr.output)).to.include('Transferring ⬢ myapp... done')
    })

    it('transfers selected apps to a personal account', async function () {
      const promptStub = sandbox.stub().resolves({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      sandbox.stub(Cmd.prototype, 'getAppsToTransfer').callsFake(promptStub)

      const api = personalToPersonal()
      await runCommand(Cmd, [
        '--bulk',
        'gandalf@heroku.com',
      ])
      api.done()
      expect(stripAnsi(stderr.output)).to.include('Warning: Transferring applications to gandalf@heroku.com...')
      expect(stripAnsi(stderr.output)).to.include('Initiating transfer of ⬢ myapp... email sent')
    })
  })

  context('when it is a personal app', function () {
    beforeEach(function () {
      personalApp()
    })

    it('transfers the app to a personal account', async function () {
      const api = personalToPersonal()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect('').to.eq(stdout.output)
      expect(stripAnsi(stderr.output)).to.include('Initiating transfer of ⬢ myapp to gandalf@heroku.com... email sent')
      api.done()
    })

    it('transfers the app to a team', async function () {
      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Transferring ⬢ myapp to team... done\n')
      api.done()
    })
  })

  context('when it is an org app', function () {
    beforeEach(function () {
      teamApp()
    })

    it('transfers the app to a personal account confirming app name', async function () {
      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Transferring ⬢ myapp to team... done\n')
      api.done()
    })

    it('transfers the app to a team', async function () {
      const api = teamAppTransfer()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Transferring ⬢ myapp to team... done\n')
      api.done()
    })

    it('transfers and locks the app if --locked is passed', async function () {
      const api = teamAppTransfer()
      const lockedAPI = nock('https://api.heroku.com:443')
        .get('/teams/apps/myapp')
        .reply(200, {name: 'myapp', locked: false})
        .patch('/teams/apps/myapp', {locked: true})
        .reply(200)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--locked',
        'team',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Transferring ⬢ myapp to team... done\nLocking myapp... done\n')
      api.done()
      lockedAPI.done()
    })
  })
})

*/
