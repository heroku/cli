import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {NotAContainerAppError, type RemoveProcessTypesOpts} from '@heroku/sdk/extensions/platform'
import {App} from '@heroku/types/3.sdk'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/container/rm.js'

type FakePlatform = {
  container: {
    ensureContainerStack: SinonStub
    removeProcessTypes: SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    container: {
      ensureContainerStack: stub(),
      removeProcessTypes: stub(),
    },
  }
}

describe('container removal', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('requires a container to be specified', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    const {message} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires one or more process types')
    expectOutput(stdout, '')
  })

  it('exits when the app stack is not "container"', async function () {
    fakePlatform.container.ensureContainerStack.rejects(new NotAContainerAppError({

      build_stack: {id: 'heroku-24', name: 'heroku-24'},
      id: 'app-id',
      name: 'testapp',
      stack: {id: 'heroku-24', name: 'heroku-24'},
    } as App))

    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)
    expectOutput(stdout, '')
  })

  context('when the app is a container app', function () {
    beforeEach(function () {
      fakePlatform.container.ensureContainerStack.resolves()
      fakePlatform.container.removeProcessTypes.callsFake(async (_app: string, processTypes: string[], opts?: RemoveProcessTypesOpts) => {
        for (const processType of processTypes) {
          opts?.poller?.onStart?.(processType)
          opts?.poller?.onStop?.(processType)
        }
      })
    })

    it('removes one container', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expectOutput(stdout, '')
      expect(stderr).to.contain('Removing container web for ⬢ testapp... done')
      expect(fakePlatform.container.removeProcessTypes.calledOnceWith('testapp', ['web'])).to.equal(true)
    })

    it('removes two containers', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
      expectOutput(stdout, '')
      expect(stderr).to.contain('Removing container web for ⬢ testapp... done')
      expect(stderr).to.contain('Removing container worker for ⬢ testapp... done')
      expect(fakePlatform.container.removeProcessTypes.calledOnceWith('testapp', ['web', 'worker'])).to.equal(true)
    })
  })
})
