import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import {AddonConfirmationRequiredError, AddonProvisioningFailedError} from '@heroku/sdk/resources/platform/add-on'
import ansis from 'ansis'
import {expect} from 'chai'
import _ from 'lodash'
import {createSandbox, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/create.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('addons:create', function () {
  let sdkMock: MockSDK

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
      price: {cents: 10_000, unit: 'month'},
    },
    provision_message: 'provision message',
    state: 'provisioned',
  }

  afterEach(function () {
    sdkMock.restore()
  })

  context('creating a db with a name', function () {
    it('passes name through to the API', async function () {
      const createAndWaitStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'foobar',
        'heroku-postgresql:standard-0',
      ])
      expect(createAndWaitStub.calledOnce).to.be.true
      const [appArg, bodyArg] = createAndWaitStub.firstCall.args
      expect(appArg).to.equal('myapp')
      expect(bodyArg.name).to.equal('foobar')
      expect(bodyArg.plan).to.equal('heroku-postgresql:standard-0')
    })
  })
  context('calling addons:create without a plan', function () {
    it('errors out with usage', async function () {
      sdkMock = mockSDKPlatform({addOn: {createAndWait: stub()}})
      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'foobar',
      ])
        .catch((error: unknown) => {
          expect((error as Error).message).to.equal('Missing 1 required arg:\n'
            + 'service:plan  unique identifier or unique name of the add-on service plan\n'
            + 'See more help with --help')
        })
    })
  })
  context('creating a db', function () {
    it('creates an add-on with proper output', async function () {
      const createAndWaitStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
      expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
      expect(stdout).to.equal('provision message\nCreated postgresql-swiftly-123 as DATABASE_URL\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
      const [appArg, bodyArg] = createAndWaitStub.firstCall.args
      expect(appArg).to.equal('myapp')
      expect(bodyArg.config).to.deep.equal({follow: 'otherdb', foo: true, rollback: true})
      expect(bodyArg.attachment).to.deep.equal({name: 'mydb'})
    })
    it('creates an add-on with proper output using old syntax with deprecation message', async function () {
      const createAndWaitStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      const {stderr} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
      expect(unwrap(stderr)).to.contain("Warning: You're using a deprecated syntax with the [--rollback,--follow,--foo] flag")
      expect(unwrap(stderr)).to.contain("Add a '--' (end of options) separator before the flags you're passing through.")
      expect(unwrap(stderr)).to.contain('For example: heroku addons:create -a myapp heroku-postgresql:standard-0 -- --rollback --follow otherdb --foo')
      expect(unwrap(stderr)).to.contain('See https://devcenter.heroku.com/changelog-items/2925 for more info.')
    })
    it('creates an addon with = args', async function () {
      const createAndWaitStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow=otherdb',
        '--foo',
      ])
      const [, bodyArg] = createAndWaitStub.firstCall.args
      expect(bodyArg.config).to.deep.equal({follow: 'otherdb', foo: true, rollback: true})
    })
    it('turns args value true into literal true, not a string', async function () {
      const createAndWaitStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow=otherdb',
        '--foo=true',
      ])
      const [, bodyArg] = createAndWaitStub.firstCall.args
      expect(bodyArg.config).to.deep.equal({follow: 'otherdb', foo: true, rollback: true})
    })
  })
  context('when add-on is async', function () {
    context('provisioning message and config vars provided by add-on provider', function () {
      it('creates an add-on with output about async provisioning', async function () {
        const asyncAddon = {..._.clone(addon), config_vars: [], state: 'provisioning'}
        const createAndWaitStub = stub().resolves(asyncAddon)
        sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

        const {stderr, stdout} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
        expect(stdout).to.equal('provision message\npostgresql-swiftly-123 is being created in the background. The app will restart when complete...\nRun heroku addons:info postgresql-swiftly-123 to check creation progress.\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
      })
    })
    context('and no provision message supplied', function () {
      it('creates an add-on with output about async provisioning', async function () {
        const asyncAddon = {
          ..._.clone(addon), config_vars: [], provision_message: undefined, state: 'provisioning',
        }
        const createAndWaitStub = stub().resolves(asyncAddon)
        sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

        const {stderr, stdout} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
        expect(stdout).to.equal('postgresql-swiftly-123 is being created in the background. The app will restart when complete...\nRun heroku addons:info postgresql-swiftly-123 to check creation progress.\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
      })
    })
    context('and no config vars supplied by add-on provider', function () {
      it('creates an add-on with output about async provisioning', async function () {
        const asyncAddon = {..._.clone(addon), config_vars: undefined, state: 'provisioning'}
        const createAndWaitStub = stub().resolves(asyncAddon)
        sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

        const {stderr, stdout} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
        expect(stdout).to.equal('provision message\npostgresql-swiftly-123 is being created in the background. The app will restart when complete...\nRun heroku addons:info postgresql-swiftly-123 to check creation progress.\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
      })
    })
    context('--wait', function () {
      let sandbox: ReturnType<typeof createSandbox>
      beforeEach(function () {
        sandbox = createSandbox()
      })
      afterEach(function () {
        sandbox.restore()
      })
      it('waits for response and notifies', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')
        // When wait is true, createAndWait calls onProvisioning then returns provisioned addon
        const createAndWaitStub = stub().callsFake(async (_app, _body, options) => {
          if (options?.onProvisioning) {
            const asyncAddon = {..._.clone(addon), config_vars: [], state: 'provisioning'}
            options.onProvisioning(asyncAddon)
          }

          return addon
        })
        sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

        const {stderr, stdout} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          '--wait',
          'heroku-postgresql:standard-0',
          '--',
          '--wait',
        ])
        expect(notifySpy.called).to.equal(true)
        expect(notifySpy.calledOnce).to.equal(true)
        expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
        expect(stderr).to.contain('Creating postgresql-swiftly-123... done')
        expect(stdout).to.equal('provision message\nWaiting for postgresql-swiftly-123...\nCreated postgresql-swiftly-123 as DATABASE_URL\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
      })
      it('notifies when provisioning failure occurs', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')
        const deprovisionedAddon = {..._.clone(addon), state: 'deprovisioned'}
        const createAndWaitStub = stub().rejects(new AddonProvisioningFailedError(deprovisionedAddon as any))
        sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

        try {
          await runCommand(Cmd, [
            '--app',
            'myapp',
            '--as',
            'mydb',
            '--wait',
            'heroku-postgresql:standard-0',
            '--',
            '--wait',
          ])
        } catch {
          expect(notifySpy.called).to.equal(true)
          expect(notifySpy.calledOnce).to.equal(true)
        }
      })
    })
    context('when add-on provision errors', function () {
      it('shows that it failed to provision', async function () {
        const deprovisionedAddon = _.clone(addon)
        deprovisionedAddon.state = 'deprovisioned'
        const createAndWaitStub = stub().rejects(new AddonProvisioningFailedError(deprovisionedAddon as any))
        sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

        const {error} = await runCommand(Cmd, [
          '--app',
          'myapp',
          '--as',
          'mydb',
          'heroku-postgresql:standard-0',
        ])
        expect(error?.message).to.equal('The add-on was unable to be created, with status deprovisioned.')
      })
    })
  })
  context('creating a db requiring confirmation', function () {
    it('aborts if confirmation does not match', async function () {
      const createAndWaitStub = stub()
        .onFirstCall().rejects(new AddonConfirmationRequiredError('This add-on is not automatically networked with this Private Space. '))
        .onSecondCall().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      return runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        '--confirm',
        'not-my-app',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
        .catch(error => {
          expect(ansis.strip(error.message)).to.equal('Confirmation not-my-app did not match myapp. Aborted.')
        })
    })

    it('succeeds if confirmation does match', async function () {
      const createAndWaitStub = stub()
        .onFirstCall().rejects(new AddonConfirmationRequiredError('This add-on is not automatically networked with this Private Space. '))
        .onSecondCall().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        '--confirm',
        'myapp',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow',
        'otherdb',
        '--foo',
      ])
      expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
      expect(stdout).to.equal('provision message\nCreated postgresql-swiftly-123 as DATABASE_URL\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
    })
  })
  context('--follow=--otherdb', function () {
    it('creates an addon with =-- args', async function () {
      const createAndWaitStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
        '--',
        '--rollback',
        '--follow=--otherdb',
        '--foo',
      ])
      const [, bodyArg] = createAndWaitStub.firstCall.args
      expect(bodyArg.config).to.deep.equal({follow: '--otherdb', foo: true, rollback: true})
    })
  })
  context('no config vars supplied by add-on provider', function () {
    it('creates an add-on without the config vars listed', async function () {
      const noConfigAddon = {..._.clone(addon), config_vars: undefined}
      const createAndWaitStub = stub().resolves(noConfigAddon)
      sdkMock = mockSDKPlatform({addOn: {createAndWait: createAndWaitStub}})

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        'mydb',
        'heroku-postgresql:standard-0',
      ])
      expect(stderr).to.contain('Creating heroku-postgresql:standard-0 on ⬢ myapp... ~$0.139/hour (max $100/month)')
      expect(stdout).to.equal('provision message\nCreated postgresql-swiftly-123\nRun heroku addons:docs heroku-postgresql to view documentation.\n')
    })
  })
})
