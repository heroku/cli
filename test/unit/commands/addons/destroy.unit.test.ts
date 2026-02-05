import * as Heroku from '@heroku-cli/schema'
import ansis from 'ansis'
import {expect} from 'chai'
import * as lolex from 'lolex'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/addons/destroy.js'
import runCommand from '../../../helpers/runCommand.js'

describe('addons:destroy', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  context('when an add-on implements sync deprovisioning', function () {
    it('destroys the add-on synchronously', async function () {
      const addon: Heroku.AddOn = {
        addon_service: {name: 'heroku-postgresql'},
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp',
        },
        config_vars: ['DATABASE_URL'],
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'postgresql-swiftly-123',
        plan: {
          name: 'heroku-postgresql:standard-0',
          price: {cents: 10000, unit: 'month'},
        },
        state: 'provisioned',
      }
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
        .reply(200, [addon])
        .delete(`/apps/${addon.app?.id}/addons/${addon.id}`, {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Destroying postgresql-swiftly-123 on ⬢ myapp... done\n')
    })
  })
  context('when an add-on implements async deprovisioning', function () {
    it('destroys the add-on asynchronously', async function () {
      const addon: Heroku.AddOn = {
        addon_service: {name: 'heroku-postgresql'},
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp',
        },
        config_vars: ['DATABASE_URL'],
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'postgresql-swiftly-123',
        plan: {
          name: 'heroku-postgresql:standard-0',
          price: {cents: 10000, unit: 'month'},
        },
        state: 'provisioned',
      }
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
        .reply(200, [addon])
        .delete(`/apps/${addon.app?.id}/addons/${addon.id}`, {force: false})
        .reply(202, {...addon, state: 'deprovisioning'})
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
      ])
      expect(stdout.output).to.equal('postgresql-swiftly-123 is being destroyed in the background. The app will restart when complete...\nRun heroku addons:info postgresql-swiftly-123 to check destruction progress\n')
      expect(ansis.strip(stderr.output)).to.contain(ansis.strip('Destroying postgresql-swiftly-123 on ⬢ myapp... pending'))
    })
    context('--wait', function () {
      let clock: ReturnType<typeof lolex.install>
      let sandbox: ReturnType<typeof sinon.createSandbox>
      beforeEach(function () {
        sandbox = sinon.createSandbox()
        clock = lolex.install()
        clock.setTimeout = function (callback: () => void, timeout: number, ...args: any[]): number {
          callback()
          return 1
        }
      })
      afterEach(function () {
        clock.uninstall()
        sandbox.restore()
      })
      it('waits for response and notifies', async function () {
        const addon: Heroku.AddOn = {
          addon_service: {name: 'heroku-postgresql'},
          app: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'myapp',
          },
          config_vars: ['DATABASE_URL'],
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'postgresql-swiftly-123',
          plan: {
            name: 'heroku-postgresql:standard-0',
            price: {cents: 10000, unit: 'month'},
          },
          state: 'provisioned',
        }
        const notifySpy = sandbox.spy(Cmd, 'notifier')
        api
          .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
          .reply(200, [addon])
          .delete(`/apps/${addon.app?.id}/addons/${addon.id}`, {force: false})
          .reply(202, {...addon, state: 'deprovisioning'})
          .get('/apps/myapp/addons/postgresql-swiftly-123')
          .reply(200, {...addon, state: 'deprovisioning'})
          .get('/apps/myapp/addons/postgresql-swiftly-123')
          .reply(404, {id: 'not_found', message: 'Not found'})
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--confirm',
          'myapp',
          '--wait',
          'postgresql-swiftly-123',
        ])
        expect(notifySpy.called).to.equal(true)
        expect(notifySpy.calledOnce).to.equal(true)
        expect(ansis.strip(stderr.output)).to.contain('Destroying postgresql-swiftly-123 on ⬢ myapp... pending')
        expect(stderr.output).to.contain('Destroying postgresql-swiftly-123... done\n')
        expect(stdout.output).to.equal('Waiting for postgresql-swiftly-123...\n')
      })
    })
  })

  it('fails when addon app is not the app specified', async function () {
    const addonInOtherApp: Heroku.AddOn = {
      addon_service: {name: 'heroku-postgresql'},
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myotherapp',
      },
      config_vars: ['DATABASE_URL'],
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'postgresql-swiftly-123',
      plan: {
        name: 'heroku-postgresql:standard-0',
        price: {cents: 10000, unit: 'month'},
      },
      state: 'provisioned',
    }
    api
      .post('/actions/addons/resolve', {addon: 'DATABASE', app: 'myapp'})
      .reply(200, [addonInOtherApp])
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'DATABASE',
      ])
      throw new Error('unreachable')
    } catch (error: unknown) {
      expect(ansis.strip((error as Error).message)).to.equal('postgresql-swiftly-123 is on ⬢ myotherapp not ⬢ myapp')
    }
  })

  it('shows that it failed to deprovision when there are errors returned', async function () {
    const addon: {state: 'suspended'} & Omit<Heroku.AddOn, 'state'> = {
      addon_service: {name: 'heroku-postgresql'},
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myapp',
      },
      config_vars: ['DATABASE_URL'],
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'postgresql-swiftly-123',
      plan: {
        name: 'heroku-postgresql:standard-0',
        price: {cents: 10000, unit: 'month'},
      },
      state: 'suspended',
    }
    api
      .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
      .reply(200, [addon])
      .delete(`/apps/${addon.app?.id}/addons/${addon.id}`, {force: false})
      .reply(403, {id: 'forbidden', message: 'Cannot delete a suspended addon'})
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
      ])
      throw new Error('unreachable')
    } catch (error: unknown) {
      expect((error as Error).message).to.equal('The add-on was unable to be destroyed: Cannot delete a suspended addon.')
    }
  })
  context('when multiple add-ons are provided', function () {
    it('destroys them all', async function () {
      const addon: Heroku.AddOn = {
        addon_service: {name: 'heroku-postgresql'},
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp',
        },
        config_vars: ['DATABASE_URL'],
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'postgresql-swiftly-123',
        plan: {
          name: 'heroku-postgresql:standard-0',
          price: {cents: 10000, unit: 'month'},
        },
        state: 'provisioned',
      }
      const addon1: Heroku.AddOn = {
        addon_service: {name: 'heroku-postgresql'},
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp',
        },
        config_vars: ['DATABASE_URL'],
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'postgresql-swiftly-124',
        plan: {
          name: 'heroku-postgresql:standard-0',
          price: {cents: 10000, unit: 'month'},
        },
        state: 'provisioned',
      }
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'}).reply(200, [addon])
        .delete(`/apps/${addon.app?.id}/addons/${addon.id}`, {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-124', app: 'myapp'}).reply(200, [addon1])
        .delete(`/apps/${addon1.app?.id}/addons/${addon1.id}`, {force: false})
        .reply(200, {...addon, state: 'deprovisioned'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
        'postgresql-swiftly-124',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.contain('Destroying postgresql-swiftly-123 on ⬢ myapp... done\n')
      expect(stderr.output).to.contain('Destroying postgresql-swiftly-124 on ⬢ myapp... done\n')
    })

    it('fails when additional addon app is not the app specified', async function () {
      const addon: Heroku.AddOn = {
        addon_service: {name: 'heroku-postgresql'},
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp',
        },
        config_vars: ['DATABASE_URL'],
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'postgresql-swiftly-123',
        plan: {
          name: 'heroku-postgresql:standard-0',
          price: {cents: 10000, unit: 'month'},
        },
        state: 'provisioned',
      }
      const addon1: Heroku.AddOn = {
        addon_service: {name: 'heroku-postgresql'},
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp2',
        },
        config_vars: ['FOREIGN_DATABASE_URL'],
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'postgresql-swiftly-124',
        plan: {
          name: 'heroku-postgresql:standard-0',
          price: {cents: 10000, unit: 'month'},
        },
        state: 'provisioned',
      }
      api
        .post('/actions/addons/resolve', {addon: 'DATABASE', app: 'myapp'}).reply(200, [addon])
        .post('/actions/addons/resolve', {addon: 'FOREIGN_DATABASE', app: 'myapp'}).reply(200, [addon1])

      try {
        await runCommand(Cmd, [
          '--app',
          'myapp',
          '--confirm',
          'myapp',
          'DATABASE',
          'FOREIGN_DATABASE',
        ])
        throw new Error('unreachable')
      } catch (error: unknown) {
        expect(ansis.strip((error as Error).message)).to.equal('postgresql-swiftly-124 is on ⬢ myapp2 not ⬢ myapp')
      }
    })
  })
})
