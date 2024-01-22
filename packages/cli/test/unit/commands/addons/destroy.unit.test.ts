import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/destroy'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
const lolex = require('lolex')
import * as sinon from 'sinon'
import stripAnsi = require('strip-ansi')

describe('addons:destroy', () => {
  afterEach(() => nock.cleanAll())
  context('when an add-on implements sync deprovisioning', () => {
    it('destroys the add-on synchronously', () => {
      const addon = {
        id: 201, name: 'db3-swiftly-123', addon_service: {name: 'heroku-db3'}, app: {name: 'myapp', id: 101}, state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db3'})
        .reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db3',
      ])
        .then(() => expect(stdout.output).to.equal(''))
        .then(() => expect(stderr.output).to.contain('Destroying db3-swiftly-123 on ⬢ myapp... done\n'))
        .then(() => api.done())
    })
  })
  context('when an add-on implements async deprovisioning', () => {
    it('destroys the add-on asynchronously', () => {
      const addon = {
        id: 201, name: 'db4-swiftly-123', addon_service: {name: 'heroku-db4'}, app: {name: 'myapp', id: 101}, state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db4'})
        .reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(202, {...addon, state: 'deprovisioning'})
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'heroku-db4',
      ])
        .then(() => expect(stdout.output).to.equal('db4-swiftly-123 is being destroyed in the background. The app will restart when complete...\nUse heroku addons:info db4-swiftly-123 to check destruction progress\n'))
        .then(() => expect(stderr.output).to.contain('Destroying db4-swiftly-123 on ⬢ myapp... pending\n'))
        .then(() => api.done())
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
        return expect(stdout.output).to.equal('Waiting for db5-swiftly-123...\n')
      })
    })
  })
  it('fails when addon app is not the app specified', () => {
    const addon_in_other_app = {
      id: 201, name: 'db6-swiftly-123', addon_service: {name: 'heroku-db6'}, app: {name: 'myotherapp', id: 102}, state: 'provisioned',
    }
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db6'})
      .reply(200, [addon_in_other_app])
    return runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'heroku-db6',
    ])
      .then(() => {
        throw new Error('unreachable')
      })
      .catch(error => {
        api.done()
        expect(stripAnsi(error.message)).to.equal('db6-swiftly-123 is on myotherapp not myapp')
      })
  })
  it('shows that it failed to deprovision when there are errors returned', function () {
    const addon = {
      id: 201, name: 'db7-swiftly-123', addon_service: {name: 'heroku-db7'}, app: {name: 'myapp', id: 101}, state: 'suspended',
    }
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db7'})
      .reply(200, [addon])
      .delete('/apps/101/addons/201', {force: false})
      .reply(403, {id: 'forbidden', message: 'Cannot delete a suspended addon'})
    return runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'heroku-db7',
    ])
      .then(() => {
        throw new Error('unreachable')
      })
      .catch(error => {
        api.done()
        expect(error.message).to.equal('The add-on was unable to be destroyed: Cannot delete a suspended addon.')
      })
  })
})
