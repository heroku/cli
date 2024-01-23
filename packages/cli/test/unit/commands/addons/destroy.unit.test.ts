import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/destroy'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
const lolex = require('lolex')
import * as sinon from 'sinon'
import stripAnsi = require('strip-ansi')

/* WARNING!!!! this file is a minefield because packages/cli/src/lib/addons/resolve.ts resolveAddon uses memoization
* You MUST change requests to have different params, or they won't be made and nock will not be satisfied */
describe('addons:destroy', () => {
  afterEach(() => nock.cleanAll())
  context('when an add-on implements sync deprovisioning', () => {
    it('destroys the add-on synchronously', async () => {
      const addon = {
        id: 201, name: 'db3-swiftly-123', addon_service: {name: 'heroku-db3'}, app: {name: 'myapp', id: 101}, state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db3'})
        .reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db3',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Destroying db3-swiftly-123 on ⬢ myapp... done\n')
      api.done()
    })
  })
  context('when an add-on implements async deprovisioning', () => {
    it('destroys the add-on asynchronously', async () => {
      const addon = {
        id: 201, name: 'db4-swiftly-123', addon_service: {name: 'heroku-db4'}, app: {name: 'myapp', id: 101}, state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db4'})
        .reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(202, {...addon, state: 'deprovisioning'})
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db4',
      ])
      expect(stdout.output).to.equal('db4-swiftly-123 is being destroyed in the background. The app will restart when complete...\nUse heroku addons:info db4-swiftly-123 to check destruction progress\n')
      expect(stderr.output).to.contain('Destroying db4-swiftly-123 on ⬢ myapp... pending\n')
      api.done()
    })
    context('--wait', () => {
      let clock: ReturnType<typeof lolex.install>
      let sandbox: ReturnType<typeof sinon.createSandbox>
      beforeEach(() => {
        sandbox = sinon.createSandbox()
        clock = lolex.install()
        clock.setTimeout = function (fn: () => unknown) {
          fn()
        }
      })
      afterEach(function () {
        clock.uninstall()
        sandbox.restore()
      })
      it('waits for response and notifies', async () => {
        const addon = {
          id: 201, name: 'db5-swiftly-123', addon_service: {name: 'heroku-db5'}, app: {name: 'myapp', id: 101}, state: 'provisioned',
        }
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        const api = nock('https://api.heroku.com:443')
          .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db5'})
          .reply(200, [addon])
          .delete('/apps/101/addons/201', {force: false})
          .reply(202, {...addon, state: 'deprovisioning'})
          .get('/apps/myapp/addons/db5-swiftly-123')
          .reply(200, {...addon, state: 'deprovisioning'})
          .get('/apps/myapp/addons/db5-swiftly-123')
          .reply(404, {id: 'not_found', message: 'Not found'})
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--confirm',
          'myapp',
          '--wait',
          'heroku-db5',
        ])
        api.done()
        expect(notifySpy.called).to.equal(true)
        expect(notifySpy.calledOnce).to.equal(true)
        expect(stderr.output).to.contain('Destroying db5-swiftly-123 on ⬢ myapp... pending\n')
        expect(stderr.output).to.contain('Destroying db5-swiftly-123... done\n')
        expect(stdout.output).to.equal('Waiting for db5-swiftly-123...\n')
      })
    })
  })
  it('fails when addon app is not the app specified', async () => {
    const addon_in_other_app = {
      id: 201, name: 'db6-swiftly-123', addon_service: {name: 'heroku-db6'}, app: {name: 'myotherapp', id: 102}, state: 'provisioned',
    }
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db6'})
      .reply(200, [addon_in_other_app])
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db6',
      ])
      throw new Error('unreachable')
    } catch (error: any) {
      api.done()
      expect(stripAnsi(error.message)).to.equal('db6-swiftly-123 is on myotherapp not myapp')
    }
  })
  it('shows that it failed to deprovision when there are errors returned', async function () {
    const addon = {
      id: 201, name: 'db7-swiftly-123', addon_service: {name: 'heroku-db7'}, app: {name: 'myapp', id: 101}, state: 'suspended',
    }
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db7'})
      .reply(200, [addon])
      .delete('/apps/101/addons/201', {force: false})
      .reply(403, {id: 'forbidden', message: 'Cannot delete a suspended addon'})
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db7',
      ])
      throw new Error('unreachable')
    } catch (error: any) {
      api.done()
      expect(error.message).to.equal('The add-on was unable to be destroyed: Cannot delete a suspended addon.')
    }
  })
  context('when an multiple add-ons provided', () => {
    it('destroys them all', async () => {
      const addon = {
        id: 201,
        name: 'db23-swiftly-123',
        addon_service: {name: 'heroku-db23'},
        app: {name: 'myapp', id: 101},
        state: 'provisioned',
      }
      const addon1 = {
        id: 301,
        name: 'db24-swiftly-123',
        addon_service: {name: 'heroku-db24'},
        app: {name: 'myapp', id: 101},
        state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db23'}).reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db24'}).reply(200, [addon1])
        .delete('/apps/101/addons/301', {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db23',
        'heroku-db24',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Destroying db23-swiftly-123 on ⬢ myapp... done\n')
      expect(stderr.output).to.contain('Destroying db24-swiftly-123 on ⬢ myapp... done\n')
      api.done()
    })

    it('fails when additional addon app is not the app specified', async () => {
      const addon = {
        id: 201,
        name: 'db13-swiftly-123',
        addon_service: {name: 'heroku-db13'},
        app: {name: 'myapp', id: 101},
        state: 'provisioned',
      }
      const addon1 = {
        id: 301,
        name: 'db14-swiftly-123',
        addon_service: {name: 'heroku-db14'},
        app: {name: 'myapp2', id: 444},
        state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db13'}).reply(200, [addon])
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db14'}).reply(200, [addon1])

      try {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--confirm',
          'myapp',
          'heroku-db13',
          'heroku-db14',
        ])
        throw new Error('unreachable')
      } catch (error: any) {
        expect(stripAnsi(error.message)).to.equal('db14-swiftly-123 is on myapp2 not myapp')
      }

      api.done()
    })
  })
})
