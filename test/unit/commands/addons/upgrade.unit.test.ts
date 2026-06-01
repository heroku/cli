import {AddOn} from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/upgrade.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

// Import the error classes from the SDK
import {AddonAmbiguousError} from '@heroku/sdk/resources/platform/add-on'

describe('addons:upgrade', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  it('upgrades an add-on', async function () {
    const addon: AddOn = {
      addon_service: {name: 'heroku-kafka'},
      app: {id: 'app-1', name: 'myapp'},
      id: 'addon-1',
      name: 'kafka-swiftly-123',
      plan: {name: 'premium-0'},
    }
    const upgradeStub = stub().callsFake(async (_addonIdentity, _plan, options) => {
      if (options?.onResolved) {
        options.onResolved(addon)
      }

      return {plan: {price: {cents: 0}}, provision_message: 'provision msg'}
    })
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-kafka',
      'heroku-kafka:hobby',
    ])
    expect(stdout).to.equal('provision msg\n')
    expect(stderr).to.contain('Changing kafka-swiftly-123 on ⬢ myapp from premium-0 to heroku-kafka:hobby... done, free')
  })

  it('displays hourly and monthly price when upgrading an add-on', async function () {
    const addon: AddOn = {
      addon_service: {name: 'heroku-kafka'},
      app: {id: 'app-1', name: 'myapp'},
      id: 'addon-1',
      name: 'kafka-swiftly-123',
      plan: {name: 'premium-0'},
    }

    const upgradeStub = stub().callsFake(async (_addonIdentity, _plan, options) => {
      if (options?.onResolved) {
        options.onResolved(addon)
      }

      return {plan: {price: {cents: 2500, unit: 'month'}}, provision_message: 'provision msg'}
    })
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-kafka',
      'heroku-kafka:standard',
    ])
    expect(stdout).to.equal('provision msg\n')
    expect(stderr).to.contain('Changing kafka-swiftly-123 on ⬢ myapp from premium-0 to heroku-kafka:standard... done, ~$0.035/hour (max $25/month)')
  })

  it('does not display a price when upgrading an add-on and no price is returned from the api', async function () {
    const addon = {
      addon_service: {name: 'heroku-kafka'},
      app: {id: 'app-1', name: 'myapp'},
      id: 'addon-1',
      name: 'kafka-swiftly-123',
      plan: {name: 'premium-0'},
    }

    const upgradeStub = stub().callsFake(async (_addonIdentity, _plan, options) => {
      if (options?.onResolved) {
        options.onResolved(addon)
      }

      return {plan: {}, provision_message: 'provision msg'}
    })
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-kafka',
      'heroku-kafka:hobby',
    ])
    expect(stdout).to.equal('provision msg\n')
    expect(stderr).to.contain('Changing kafka-swiftly-123 on ⬢ myapp from premium-0 to heroku-kafka:hobby... done')
  })

  it('upgrades to a contract add-on', async function () {
    const addon = {
      addon_service: {name: 'heroku-connect'},
      app: {id: 'app-1', name: 'myapp'},
      id: 'addon-1',
      name: 'connect-swiftly-123',
      plan: {name: 'free'},
    }

    const upgradeStub = stub().callsFake(async (_addonIdentity, _plan, options) => {
      if (options?.onResolved) {
        options.onResolved(addon)
      }

      return {plan: {price: {cents: 0, contract: true}}, provision_message: 'provision msg'}
    })
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-connect',
      'heroku-connect:contract',
    ])
    expect(stdout).to.equal('provision msg\n')
    expect(stderr).to.contain('Changing connect-swiftly-123 on ⬢ myapp from free to heroku-connect:contract... done, contract')
  })

  it('upgrades an add-on with only one argument', async function () {
    const addon = {
      addon_service: {name: 'heroku-postgresql'},
      app: {id: 'app-1', name: 'myapp'},
      id: 'addon-1',
      name: 'postgresql-swiftly-123',
      plan: {name: 'premium-0'},
    }
    const upgradeStub = stub().callsFake(async (_addonIdentity, _plan, options) => {
      if (options?.onResolved) {
        options.onResolved(addon)
      }

      return {plan: {price: {cents: 0}}}
    })
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-postgresql:hobby',
    ])
    expect(stdout, 'to be empty')
    expect(stderr).to.contain('Changing postgresql-swiftly-123 on ⬢ myapp from premium-0 to heroku-postgresql:hobby... done, free')
  })

  it('errors with no plan', async function () {
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: stub()}})
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'heroku-redis',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.contain('Error: No plan specified')
      }
    }
  })

  it('errors with invalid plan', async function () {
    const addon = {
      addon_service: {name: 'heroku-db1'},
      app: {id: 'app-1', name: 'myapp'},
      id: 'addon-1',
      name: 'db1-swiftly-123',
      plan: {name: 'premium-0'},
    }

    const apiError = new Error('Couldn\'t find either the add-on service or the add-on plan of "heroku-db1:invalid".') as Error & {statusCode: number}
    apiError.statusCode = 422
    const upgradeStub = stub().callsFake(async (_addonIdentity, _plan, options) => {
      if (options?.onResolved) {
        options.onResolved(addon)
      }

      throw apiError
    })
    const listPlansStub = stub().resolves([
      {name: 'heroku-db1:free', plan: {cents: 0}},
      {name: 'heroku-db1:basic', plan: {cents: 25}},
      {name: 'heroku-db1:premium-0', price: {cents: 3500}},
    ])
    sdkMock = mockSDKPlatform({addOn: {listPlans: listPlansStub, upgrade: upgradeStub}})

    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'heroku-db1:invalid',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(ansis.strip(error.message)).to.equal('Couldn\'t find either the add-on service or the add-on plan of "heroku-db1:invalid".\n\nHere are the available plans for heroku-db1:\nheroku-db1:free\nheroku-db1:basic\nheroku-db1:premium-0\n\nSee more plan information with heroku addons:plans heroku-db1\n\nhttps://devcenter.heroku.com/articles/managing-add-ons')
      }
    }
  })

  it('displays an error when multiple matches exist', async function () {
    const upgradeStub = stub().rejects(new AddonAmbiguousError([{name: 'addon-1'}, {name: 'addon-2'}] as any))
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'heroku-postgresql:hobby',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.contain('Multiple add-ons match')
      }
    }
  })

  it('handles multiple add-ons', async function () {
    const upgradeStub = stub().rejects(new AddonAmbiguousError([{name: 'db1-swiftly-123'}, {name: 'db1-swiftly-456'}] as any))
    sdkMock = mockSDKPlatform({addOn: {listPlans: stub().resolves([]), upgrade: upgradeStub}})
    try {
      await runCommand(Cmd, [
        'heroku-redis:invalid',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.contain('multiple matching add-ons found')
      }
    }
  })
})
