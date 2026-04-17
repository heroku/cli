import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {createSandbox, SinonSandbox} from 'sinon'

import Cmd from '../../../../src/commands/apps/transfer.js'
import {apps, personalApp, teamApp} from '../../../helpers/stubs/get.js'
import {teamAppTransfer} from '../../../helpers/stubs/patch.js'
import {personalToPersonal} from '../../../helpers/stubs/post.js'

describe('heroku apps:transfer', function () {
  let sandbox: SinonSandbox

  beforeEach(function () {
    sandbox = createSandbox()
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
      const {stderr} = await runCommand(Cmd, [
        '--bulk',
        'team',
      ])
      api.done()
      expect(ansis.strip(stderr)).to.include('Warning: Transferring applications to team...')
      expect(ansis.strip(stderr)).to.include('Transferring ⬢ myapp... done')
    })

    it('transfers selected apps to a personal account', async function () {
      const promptStub = sandbox.stub().resolves({choices: [{name: 'myapp', owner: 'foo@foo.com'}]})
      sandbox.stub(Cmd.prototype, 'getAppsToTransfer').callsFake(promptStub)

      const api = personalToPersonal()
      const {stderr} = await runCommand(Cmd, [
        '--bulk',
        'gandalf@heroku.com',
      ])
      api.done()
      expect(ansis.strip(stderr)).to.include('Warning: Transferring applications to gandalf@heroku.com...')
      expect(ansis.strip(stderr)).to.include('Initiating transfer of ⬢ myapp... email sent')
    })
  })

  context('when it is a personal app', function () {
    beforeEach(function () {
      personalApp()
    })

    it('transfers the app to a personal account', async function () {
      const api = personalToPersonal()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect('').to.eq(stdout)
      expect(ansis.strip(stderr)).to.include('Initiating transfer of ⬢ myapp to gandalf@heroku.com... email sent')
      api.done()
    })

    it('transfers the app to a team', async function () {
      const api = teamAppTransfer()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\n')
      api.done()
    })
  })

  context('when it is an org app', function () {
    beforeEach(function () {
      teamApp()
    })

    it('transfers the app to a personal account confirming app name', async function () {
      const api = teamAppTransfer()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\n')
      api.done()
    })

    it('transfers the app to a team', async function () {
      const api = teamAppTransfer()
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'team',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Transferring ⬢ myapp to team... done\n')
      api.done()
    })

    it('transfers and locks the app if --locked is passed', async function () {
      const api = teamAppTransfer()
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
      api.done()
      lockedAPI.done()
    })
  })
})
