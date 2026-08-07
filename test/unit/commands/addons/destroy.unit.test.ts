import type {AddOn} from '@heroku/types/3.sdk'

import {runCommand} from '@heroku-cli/test-utils'
import {AddonProvisioningFailedError} from '@heroku/sdk/resources/platform/add-on'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {createSandbox, match, SinonStub} from 'sinon'

import Cmd from '../../../../src/commands/addons/destroy.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

const baseAddon: AddOn = {
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
    price: {cents: 10_000, unit: 'month'},
  },
  state: 'provisioned',
} as unknown as AddOn

describe('addons:destroy', function () {
  let api: nock.Scope
  let sdkMock: MockSDK
  let destroyAndWait: SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    destroyAndWait = createSandbox().stub()
    sdkMock = mockSDKPlatform({addOn: {destroyAndWait}})
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    sdkMock.restore()
  })

  context('when an add-on implements sync deprovisioning', function () {
    it('destroys the add-on synchronously', async function () {
      const addon = baseAddon
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
        .reply(200, [addon])
      destroyAndWait.resolves({...addon, state: 'deprovisioned'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.contain('Destroying postgresql-swiftly-123 on ⬢ myapp... done\n')
      expect(destroyAndWait.calledOnceWith('myapp', 'postgresql-swiftly-123', match.has('force', false))).to.equal(true)
      expect(destroyAndWait.getCall(0).args[2].wait).to.not.equal(true)
    })
  })

  context('when an add-on implements async deprovisioning', function () {
    it('destroys the add-on asynchronously', async function () {
      const addon = baseAddon
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
        .reply(200, [addon])
      destroyAndWait.resolves({...addon, state: 'deprovisioning'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
      ])
      expect(stdout).to.equal('postgresql-swiftly-123 is being destroyed in the background. The app will restart when complete...\nRun heroku addons:info postgresql-swiftly-123 to check destruction progress\n')
      expect(ansis.strip(stderr)).to.contain(ansis.strip('Destroying postgresql-swiftly-123 on ⬢ myapp... pending'))
    })

    it('with --wait, waits for response and notifies', async function () {
      const addon = baseAddon
      const sandbox = createSandbox()
      const notifySpy = sandbox.spy(Cmd, 'notifier')
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
        .reply(200, [addon])
      // The SDK's destroyAndWait fires onDeprovisioning before polling; mimic that
      // two-phase UX here, then resolve as fully deprovisioned.
      destroyAndWait.callsFake(async (_appIdentity, _addonIdentity, options) => {
        await options.onDeprovisioning?.({...addon, state: 'deprovisioning'})
        return {...addon, state: 'deprovisioned'}
      })

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--wait',
        'postgresql-swiftly-123',
      ])
      expect(notifySpy.called).to.equal(true)
      expect(notifySpy.calledOnce).to.equal(true)
      expect(ansis.strip(stderr)).to.contain('Destroying postgresql-swiftly-123 on ⬢ myapp... pending')
      expect(stderr).to.contain('Destroying postgresql-swiftly-123... done\n')
      expect(stdout).to.equal('Waiting for postgresql-swiftly-123...\n')
      expect(destroyAndWait.calledOnceWith('myapp', 'postgresql-swiftly-123', match({force: false, wait: true}))).to.equal(true)
      expect(destroyAndWait.getCall(0).args[2].wait).to.equal(true)
      sandbox.restore()
    })

    it('with --wait, notifies of failure and rethrows when deprovisioning fails', async function () {
      const addon = baseAddon
      const sandbox = createSandbox()
      const notifySpy = sandbox.spy(Cmd, 'notifier')
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
        .reply(200, [addon])
      destroyAndWait.rejects(new AddonProvisioningFailedError({...addon, state: 'provisioned'}))

      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--wait',
        'postgresql-swiftly-123',
      ])
      expect(notifySpy.calledOnce).to.equal(true)
      expect(notifySpy.calledWith('heroku addons:destroy postgresql-swiftly-123', 'Add-on failed to deprovision', false)).to.equal(true)
      expect(error?.message).to.equal('The add-on was unable to be destroyed, with status provisioned.')
      sandbox.restore()
    })
  })

  it('fails when addon app is not the app specified', async function () {
    const addonInOtherApp: AddOn = {
      ...baseAddon,
      app: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'myotherapp',
      },
    } as unknown as AddOn
    api
      .post('/actions/addons/resolve', {addon: 'DATABASE', app: 'myapp'})
      .reply(200, [addonInOtherApp])
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'DATABASE',
    ])
    expect(ansis.strip(error?.message || '')).to.equal('postgresql-swiftly-123 is on ⬢ myotherapp not ⬢ myapp')
    expect(destroyAndWait.called).to.equal(false)
  })

  it('shows that it failed to deprovision when there are errors returned', async function () {
    const addon = baseAddon
    api
      .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
      .reply(200, [addon])
    destroyAndWait.rejects(new Error('Cannot delete a suspended addon'))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'postgresql-swiftly-123',
    ])
    expect(error?.message).to.equal('The add-on was unable to be destroyed: Cannot delete a suspended addon.')
  })

  it('surfaces the database-specific error copy for advanced databases', async function () {
    const advancedAddon: AddOn = {
      ...baseAddon,
      plan: {
        name: 'heroku-postgresql:advanced-0',
        price: {cents: 100_000, unit: 'month'},
      },
    } as unknown as AddOn
    api
      .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'})
      .reply(200, [advancedAddon])
    destroyAndWait.rejects(new Error('Cannot delete a suspended addon'))

    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'postgresql-swiftly-123',
    ])
    expect(error?.message).to.equal('We can\'t destroy your database due to an error: Cannot delete a suspended addon. Try again or open a ticket with Heroku Support: https://help.heroku.com/')
  })

  context('when multiple add-ons are provided', function () {
    it('destroys them all', async function () {
      const addon = baseAddon
      const addon1: AddOn = {...baseAddon, name: 'postgresql-swiftly-124'} as unknown as AddOn
      api
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-123', app: 'myapp'}).reply(200, [addon])
        .post('/actions/addons/resolve', {addon: 'postgresql-swiftly-124', app: 'myapp'}).reply(200, [addon1])
      destroyAndWait
        .withArgs('myapp', 'postgresql-swiftly-123', match.any).resolves({...addon, state: 'deprovisioned'})
        .withArgs('myapp', 'postgresql-swiftly-124', match.any).resolves({...addon1, state: 'deprovisioned'})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgresql-swiftly-123',
        'postgresql-swiftly-124',
      ])
      expect(stdout).to.equal('')
      expect(stderr).to.contain('Destroying postgresql-swiftly-123 on ⬢ myapp... done\n')
      expect(stderr).to.contain('Destroying postgresql-swiftly-124 on ⬢ myapp... done\n')
      expect(destroyAndWait.calledTwice).to.equal(true)
    })

    it('fails when additional addon app is not the app specified', async function () {
      const addon = baseAddon
      const addon1: AddOn = {
        ...baseAddon,
        app: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'myapp2',
        },
        config_vars: ['FOREIGN_DATABASE_URL'],
        name: 'postgresql-swiftly-124',
      } as unknown as AddOn
      api
        .post('/actions/addons/resolve', {addon: 'DATABASE', app: 'myapp'}).reply(200, [addon])
        .post('/actions/addons/resolve', {addon: 'FOREIGN_DATABASE', app: 'myapp'}).reply(200, [addon1])

      const {error} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'DATABASE',
        'FOREIGN_DATABASE',
      ])
      expect(ansis.strip(error?.message || '')).to.equal('postgresql-swiftly-124 is on ⬢ myapp2 not ⬢ myapp')
      expect(destroyAndWait.called).to.equal(false)
    })
  })
})
