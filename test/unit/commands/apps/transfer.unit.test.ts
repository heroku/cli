import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'
import {createSandbox, SinonSandbox} from 'sinon'

import Cmd from '../../../../src/commands/apps/transfer.js'
import ConfirmCommand from '../../../../src/lib/confirm-command.js'

type FakePlatform = {
  app: {
    info: sinon.SinonStub
    list: sinon.SinonStub
    transfer: sinon.SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: sinon.stub(), list: sinon.stub(), transfer: sinon.stub()},
  }
}

describe('heroku apps:transfer', function () {
  let fakePlatform: FakePlatform
  let sandbox: SinonSandbox

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
    sandbox = createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
    sinon.restore()
    return nock.cleanAll()
  })

  context('when transferring in bulk', function () {
    it('transfers selected apps to a team', async function () {
      // getAppsToTransfer is stubbed, so app.list's return is ignored — but it's
      // still awaited, so it must resolve.
      fakePlatform.app.list.resolves([])
      const promptStub = sandbox.stub().resolves({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      sandbox.stub(Cmd.prototype, 'getAppsToTransfer').callsFake(promptStub)
      // recipient 'team' isn't a valid email → personalToPersonal false → team-transfer
      // presentation; a non-pending state prints 'done'.
      fakePlatform.app.transfer.resolves({state: 'transferred'})

      const {stderr} = await runCommand(Cmd, [
        '--bulk',
        'team',
      ])
      expect(ansis.strip(stderr)).to.include('Warning: Transferring applications to team...')
      expect(ansis.strip(stderr)).to.include('Transferring ⬢ myapp... done')
    })

    it('transfers selected apps to a personal account', async function () {
      fakePlatform.app.list.resolves([])
      const promptStub = sandbox.stub().resolves({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      sandbox.stub(Cmd.prototype, 'getAppsToTransfer').callsFake(promptStub)
      // personal recipient + personal-owned app → personal-transfer presentation;
      // a pending state prints 'email sent'.
      fakePlatform.app.transfer.resolves({state: 'pending'})

      const {stderr} = await runCommand(Cmd, [
        '--bulk',
        'gandalf@heroku.com',
      ])
      expect(ansis.strip(stderr)).to.include('Warning: Transferring applications to gandalf@heroku.com...')
      expect(ansis.strip(stderr)).to.include('Initiating transfer of ⬢ myapp... email sent')
    })
  })

  context('when it is a personal app', function () {
    beforeEach(function () {
      // Personal email owner → isTeamApp(owner) is false, mirroring the old personalApp() fixture.
      fakePlatform.app.info.resolves({name: 'myapp', owner: {email: 'gandalf@heroku.com'}})
    })

    it('transfers the app to a personal account', async function () {
      fakePlatform.app.transfer.resolves({state: 'pending'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect('').to.eq(stdout)
      expect(ansis.strip(stderr)).to.include('Initiating transfer of ⬢ myapp to gandalf@heroku.com... email sent')
      // isValidEmail(recipient) && !isTeamApp(owner) → personalToPersonal true.
      expect(fakePlatform.app.transfer.calledWith(
        'myapp',
        'gandalf@heroku.com',
        sinon.match({personalToPersonal: true}),
      )).to.equal(true)
    })

    it('transfers the app to a team', async function () {
      fakePlatform.app.transfer.resolves({state: 'transferred'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\n')
      // recipient 'team' isn't a valid email → personalToPersonal false.
      expect(fakePlatform.app.transfer.calledWith(
        'myapp',
        'team',
        sinon.match({personalToPersonal: false}),
      )).to.equal(true)
    })
  })

  context('when it is an org app', function () {
    beforeEach(function () {
      // Team email owner (@herokumanager.com) → isTeamApp(owner) is true, mirroring the old teamApp() fixture.
      fakePlatform.app.info.resolves({name: 'myapp', owner: {email: 'myteam@herokumanager.com'}})
    })

    it('ignores the --confirm flag when the recipient is not a valid email', async function () {
      const confirmSpy = sandbox.spy(ConfirmCommand.prototype, 'confirm')
      fakePlatform.app.transfer.resolves({state: 'transferred'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\n')
      // recipient 'team' isn't a valid email → the confirm guard never fires.
      expect(confirmSpy.called).to.equal(false)
      expect(fakePlatform.app.transfer.calledWith(
        'myapp',
        'team',
        sinon.match({personalToPersonal: false}),
      )).to.equal(true)
    })

    it('confirms before transferring a team app to a personal recipient', async function () {
      const confirmSpy = sandbox.spy(ConfirmCommand.prototype, 'confirm')
      fakePlatform.app.transfer.resolves({state: 'pending'})

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect(confirmSpy.calledOnceWith('myapp', 'myapp', 'All collaborators will be removed from this app')).to.equal(true)
      // recipient is styled with color.team even though it's an email → strip ANSI.
      expect(ansis.strip(stderr)).to.include('Transferring ⬢ myapp to gandalf@heroku.com... email sent')
      expect(fakePlatform.app.transfer.calledWith(
        'myapp',
        'gandalf@heroku.com',
        sinon.match({personalToPersonal: false}),
      )).to.equal(true)
    })

    it('transfers the app to a team', async function () {
      fakePlatform.app.transfer.resolves({state: 'transferred'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\n')
      // team-owned app → personalToPersonal is always false.
      expect(fakePlatform.app.transfer.calledWith(
        'myapp',
        'team',
        sinon.match({personalToPersonal: false}),
      )).to.equal(true)
    })

    it('transfers and locks the app if --locked is passed', async function () {
      fakePlatform.app.transfer.resolves({state: 'transferred'})
      // AppsLock is a separate command still on raw this.heroku, so it keeps nock.
      const lockedAPI = nock('https://api.heroku.com:443')
        .get('/teams/apps/myapp')
        .reply(200, {locked: false, name: 'myapp'})
        .patch('/teams/apps/myapp', {locked: true})
        .reply(200)
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--locked',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\nLocking ⬢ myapp... done\n')
      // team-owned app → personalToPersonal is always false.
      expect(fakePlatform.app.transfer.calledWith(
        'myapp',
        'team',
        sinon.match({personalToPersonal: false}),
      )).to.equal(true)
      lockedAPI.done()
    })
  })

  context('extension wiring', function () {
    // Unlike the other tests, this one does NOT stub the HerokuSDK.platform
    // getter. Instead it stubs appExtensions.factory (the same bundle
    // transfer.ts passes to `new HerokuSDK({extensions: [appExtensions]})`)
    // so the real merge plumbing runs. If the command stops passing
    // {extensions: [appExtensions]}, the factory is never invoked, the
    // transfer method is never wired in, and this test fails.
    it('wires appExtensions into the platform namespace', async function () {
      // Neutralize the beforeEach getter stub so the real getter runs.
      sinon.restore()

      const transferStub = sinon.stub().resolves({state: 'pending'})
      sinon.stub(appExtensions, 'factory').returns({
        createAndSetup: sinon.stub(),
        transfer: transferStub,
      } as never)

      // transfer's single-app path calls the real platform.app.info(app)
      // before transfer; intercept just that one GET so a personal-owned
      // app + valid-email recipient makes personalToPersonal true.
      const infoAPI = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, {name: 'myapp', owner: {email: 'frodo@heroku.com'}})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])

      expect(transferStub.calledWith(
        'myapp',
        'gandalf@heroku.com',
        sinon.match({personalToPersonal: true}),
      )).to.equal(true)
      infoAPI.done()
    })
  })
})
