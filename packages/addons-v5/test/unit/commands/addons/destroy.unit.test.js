/* eslint-disable max-nested-callbacks */
/* globals commands context beforeEach afterEach cli nock */

'use strict'

const cmd = commands.find(c => c.topic === 'addons' && c.command === 'destroy')
const {expect} = require('chai')
const lolex = require('lolex')
const sinon = require('sinon')
const theredoc = require('theredoc')

describe('addons:destroy', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  context('when an add-on implements sync deprovisioning', () => {
    it('destroys the add-on synchronously', () => {
      const addon = {
        id: 201,
        name: 'db3-swiftly-123',
        addon_service: {name: 'heroku-db3'},
        app: {name: 'myapp', id: 101},
        state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db3'}).reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})

      return cmd.run({app: 'myapp', args: ['heroku-db3'], flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal('Destroying db3-swiftly-123 on myapp... done\n'))
        .then(() => api.done())
    })
  })

  context('when an add-on implements async deprovisioning', () => {
    it('destroys the add-on asynchronously', () => {
      const addon = {
        id: 201,
        name: 'db4-swiftly-123',
        addon_service: {name: 'heroku-db4'},
        app: {name: 'myapp', id: 101},
        state: 'provisioned',
      }
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db4'})
        .reply(200, [addon])
        .delete('/apps/101/addons/201', {force: false})
        .reply(202, {...addon, state: 'deprovisioning'})

      return cmd.run({app: 'myapp', args: ['heroku-db4'], flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(theredoc`
          db4-swiftly-123 is being destroyed in the background. The app will restart when complete...
          Use heroku addons:info db4-swiftly-123 to check destruction progress\n
        `))
        .then(() => expect(cli.stderr).to.equal('Destroying db4-swiftly-123 on myapp... pending\n'))
        .then(() => api.done())
    })

    context('--wait', () => {
      let clock
      let sandbox

      beforeEach(() => {
        sandbox = sinon.createSandbox()
        clock = lolex.install()
        clock.setTimeout = function (fn) {
          fn()
        }
      })

      afterEach(function () {
        clock.uninstall()
        sandbox.restore()
      })

      it('waits for response and notifies', () => {
        const addon = {
          id: 201,
          name: 'db5-swiftly-123',
          addon_service: {name: 'heroku-db5'},
          app: {name: 'myapp', id: 101},
          state: 'provisioned',
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
          .reply(404, {id: 'not_found', message: 'Not found'}) // when it has been deprovisioned

        return cmd.run({app: 'myapp', args: ['heroku-db5'], flags: {confirm: 'myapp', wait: true}})
          .then(() => api.done())
          .then(() => expect(notifySpy.called).to.equal(true))
          .then(() => expect(notifySpy.calledOnce).to.equal(true))
          .then(() => expect(cli.stderr).to.equal(theredoc`
            Destroying db5-swiftly-123 on myapp... pending
            Destroying db5-swiftly-123... done\n
          `))
          .then(() => expect(cli.stdout).to.equal('Waiting for db5-swiftly-123...\n'))
      })
    })
  })

  it('fails when addon app is not the app specified', () => {
    const addon_in_other_app = {
      id: 201,
      name: 'db6-swiftly-123',
      addon_service: {name: 'heroku-db6'},
      app: {name: 'myotherapp', id: 102},
      state: 'provisioned',
    }
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db6'})
      .reply(200, [addon_in_other_app])

    return cmd.run({app: 'myapp', args: ['heroku-db6'], flags: {confirm: 'myapp'}})
      .then(() => {
        throw new Error('unreachable')
      })
      .catch(error => {
        api.done()
        expect(error.message).to.equal('db6-swiftly-123 is on myotherapp not myapp')
      })
  })

  it('shows that it failed to deprovision when there are errors returned', function () {
    const addon = {
      id: 201,
      name: 'db7-swiftly-123',
      addon_service: {name: 'heroku-db7'},
      app: {name: 'myapp', id: 101},
      state: 'suspended',
    }
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db7'})
      .reply(200, [addon])
      .delete('/apps/101/addons/201', {force: false})
      .reply(403, {id: 'forbidden', message: 'Cannot delete a suspended addon'})

    return cmd.run({app: 'myapp', args: ['heroku-db7'], flags: {confirm: 'myapp'}})
      .then(() => {
        throw new Error('unreachable')
      })
      .catch(error => {
        api.done()
        expect(error.message).to.equal('The add-on was unable to be destroyed: Cannot delete a suspended addon.')
      })
  })
})
