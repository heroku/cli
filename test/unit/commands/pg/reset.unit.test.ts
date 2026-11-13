import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/reset.js'
import ConfirmCommand from '../../../../src/lib/confirm-command.js'

const heredoc = tsheredoc

const addon = {
  id: 'addon-1',
  name: 'postgres-1',
}

const resetResult = {id: 'addon-1', state: 'available'}

interface ResetPreview {
  addon: typeof addon
}

interface ResetOptions {
  beforeReset?: (preview: ResetPreview) => Promise<void> | void
  extensions?: string[]
}

interface FakeData {
  database: {resetForApp: SinonStub}
}

const resetWith = (result: unknown, onReset = () => {}) => async (_app: string, _database?: string, options: ResetOptions = {}) => {
  await options.beforeReset?.({addon})
  onReset()

  return {addon, result}
}

describe('pg:reset', function () {
  let fakeData: FakeData
  let resetRequested: boolean

  beforeEach(function () {
    resetRequested = false
    fakeData = {database: {resetForApp: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('resets the default database', async function () {
    fakeData.database.resetForApp.callsFake(resetWith(resetResult, () => {
      resetRequested = true
    }))

    const {result, stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'myapp',
    ])

    expect(fakeData.database.resetForApp.calledOnce).to.equal(true)
    expect(fakeData.database.resetForApp.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.database.resetForApp.firstCall.args[1]).to.be.undefined
    expect(fakeData.database.resetForApp.firstCall.args[2].extensions).to.be.undefined
    expect(resetRequested).to.equal(true)
    expect(result).to.deep.equal({addon, result: resetResult})
    expect(stdout).to.equal('')
    expectOutput(stderr, 'Resetting postgres-1... done')
  })

  it('passes the database identity and pre-installed extensions to the SDK', async function () {
    fakeData.database.resetForApp.callsFake(resetWith(resetResult))

    const {result, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '-c', 'myapp', '-e', 'uuid-ossp, Postgis', 'DATABASE_URL',
    ])

    expect(fakeData.database.resetForApp.calledOnce).to.equal(true)
    expect(fakeData.database.resetForApp.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.database.resetForApp.firstCall.args[1]).to.equal('DATABASE_URL')
    expect(fakeData.database.resetForApp.firstCall.args[2].extensions).to.equal('uuid-ossp, Postgis')
    expect(result).to.deep.equal({addon, result: resetResult})
    expectOutput(stderr, 'Resetting postgres-1... done')
  })

  it('does not reset when confirmation does not match the app', async function () {
    fakeData.database.resetForApp.callsFake(resetWith(resetResult, () => {
      resetRequested = true
    }))

    const {error, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'another-app',
    ])

    expect(ansis.strip((error as Error).message)).to.contain('Confirmation another-app did not match myapp. Aborted.')
    expect(fakeData.database.resetForApp.calledOnce).to.equal(true)
    expect(fakeData.database.resetForApp.firstCall.args[2].beforeReset).to.be.a('function')
    expect(resetRequested).to.equal(false)
    expect(stderr).to.equal('')
  })

  it('does not reset when the SDK rejects', async function () {
    const error = new Error('reset failed')
    fakeData.database.resetForApp.callsFake(async (_app: string, _database: string | undefined, options: ResetOptions = {}) => {
      await options.beforeReset?.({addon})
      throw error
    })

    const {error: commandError, stderr} = await runCommand(Cmd, [
      '--app', 'myapp', '--confirm', 'myapp',
    ])

    expect(commandError).to.equal(error)
    expect(stderr).to.contain('Resetting postgres-1...')
    expect(stderr).to.not.contain('done')
  })

  it('passes the destructive-action message to confirmation when --confirm is omitted', async function () {
    fakeData.database.resetForApp.callsFake(resetWith(resetResult))
    const confirm = stub(ConfirmCommand.prototype, 'confirm').resolves()

    const {stderr} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(confirm.calledOnce).to.equal(true)
    expect(confirm.firstCall.args[0]).to.equal('myapp')
    expect(confirm.firstCall.args[1]).to.be.undefined
    expect(ansis.strip(confirm.firstCall.args[2] as string)).to.equal(heredoc(`
      Destructive action
      postgres-1 will lose all of its data
    `))
    expect(stderr).to.contain('Resetting postgres-1... done')
  })
})
