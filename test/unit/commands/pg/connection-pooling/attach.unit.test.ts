import {runCommand} from '@heroku-cli/test-utils'
import {EssentialDatabaseNotSupportedError} from '@heroku/sdk/extensions/data'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../../src/commands/pg/connection-pooling/attach.js'
import {MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

describe('pg:connection-pooling:attach', function () {
  const addon = {
    id: '1234',
    name: 'postgres-1',
    plan: {name: 'heroku-postgresql:standard-0'},
  }
  const attachmentName = 'CONNECTION_POOL'
  let attach: sinon.SinonStub
  let sdkMock: MockSDK

  /** Mirrors the SDK's hook order: onResolved, create, onAttached, then the release lookup. */
  function fakeAttach(attachment: {name?: string}, releaseVersion?: number) {
    return sinon.stub().callsFake(async (_app: string, _db: string | undefined, _body: unknown, opts) => {
      await opts?.onResolved?.(addon)
      await opts?.onAttached?.(attachment)
      return {addon, attachment, releaseVersion}
    })
  }

  function stubSDK(stub: sinon.SinonStub) {
    attach = stub
    sdkMock = mockSDKData({connectionPooling: {attach}})
  }

  afterEach(function () {
    sdkMock.restore()
  })

  context('includes an attachment name', function () {
    it('attaches pgbouncer with attachment name', async function () {
      stubSDK(fakeAttach({name: attachmentName}, 0))

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--as',
        attachmentName,
        'postgres-1',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling Connection Pooling on')
      expect(stderr).to.contain(`Setting ${attachmentName} config vars and restarting ⬢ myapp... done, v0`)
      expect(attach.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'postgres-1', {name: attachmentName}])
    })
  })

  context('base command with no credential or attachment name', function () {
    it('attaches pgbouncer with default credential', async function () {
      stubSDK(fakeAttach({name: 'HEROKU_COLOR'}, 0))

      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-1',
      ])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling Connection Pooling on')
      expect(stderr).to.contain('Setting HEROKU_COLOR config vars and restarting ⬢ myapp... done, v0')
      expect(attach.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', 'postgres-1', {name: undefined}])
    })
  })

  context('database resolution and release lookup', function () {
    it('uses DATABASE_URL when no database is given and reports the newest release', async function () {
      stubSDK(fakeAttach({name: 'DATABASE_CONNECTION_POOL'}, 42))

      const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp'])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Enabling Connection Pooling on ⛁ postgres-1 to ⬢ myapp... done')
      expect(stderr).to.contain('Setting DATABASE_CONNECTION_POOL config vars and restarting ⬢ myapp... done, v42')
      expect(attach.firstCall.args[1]).to.equal(undefined)
    })

    it('refuses an Essential-tier database without attaching', async function () {
      stubSDK(sinon.stub().rejects(new EssentialDatabaseNotSupportedError(addon as never, 'essential')))

      const {error} = await runCommand(Cmd, ['--app', 'myapp', 'postgres-1'])

      expect(error?.message).to.equal('You can\'t perform this operation on Essential-tier databases.')
    })

    it('prints done without a version when the release lookup came back empty', async function () {
      stubSDK(fakeAttach({name: 'DATABASE_CONNECTION_POOL'}))

      const {stderr} = await runCommand(Cmd, ['--app', 'myapp'])

      expect(stderr).to.contain('Setting DATABASE_CONNECTION_POOL config vars and restarting ⬢ myapp... done\n')
    })

    it('stops the spinner with a failure marker and rethrows when the attach fails', async function () {
      stubSDK(sinon.stub().callsFake(async (_app: string, _db: string | undefined, _body: unknown, opts) => {
        await opts?.onResolved?.(addon)
        throw new Error('attach failed')
      }))

      const {error, stderr} = await runCommand(Cmd, ['--app', 'myapp'])

      expect(error?.message).to.equal('attach failed')
      expect(stderr).to.contain('Enabling Connection Pooling on ⛁ postgres-1 to ⬢ myapp... !')
    })
  })
})
