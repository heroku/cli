import {runCommand} from '@heroku-cli/test-utils'
import {LegacyDatabaseWaitError} from '@heroku/sdk/extensions/data'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import {
  createSandbox,
  match,
  SinonStub,
  stub,
} from 'sinon'

import Cmd from '../../../../src/commands/pg/wait.js'
import {type MockSDK, mockSDKData} from '../../../helpers/mock-sdk.js'

const addon = {
  app: {id: 'app-1', name: 'myapp'},
  id: 'addon-1',
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:hobby-dev'},
}
const otherAddon = {
  app: {id: 'app-1', name: 'myapp'},
  id: 'addon-2',
  name: 'postgres-2',
  plan: {name: 'heroku-postgresql:hobby-dev'},
}

interface WaitStatus {
  'error?'?: boolean
  message?: string
  step?: string
  'waiting?'?: boolean
}

interface WaitForReadyOptions {
  onPoll?: (event: {addon: typeof addon, status: WaitStatus}) => void
  waitIntervalMs?: number
}

interface FakeData {
  database: {waitForReadyForApp: SinonStub}
}

const waitThrough = (databases: Array<{addon: typeof addon, status: WaitStatus}[]>) =>
  async (_app: string, _database: string | undefined, options: WaitForReadyOptions = {}) => {
    for (const events of databases) {
      for (const event of events) options.onPoll?.(event)
    }

    return {databases: databases.map(events => ({addon: events.at(-1)!.addon, status: events.at(-1)!.status}))}
  }

describe('pg:wait', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK
  let sandbox: ReturnType<typeof createSandbox>

  beforeEach(function () {
    sandbox = createSandbox()
    fakeData = {database: {waitForReadyForApp: stub()}}
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sandbox.restore()
    sdkMock.restore()
  })

  it('waits for a database to be available', async function () {
    fakeData.database.waitForReadyForApp.callsFake(waitThrough([[
      {addon, status: {message: 'pending', 'waiting?': true}},
      {addon, status: {message: 'available', 'waiting?': false}},
    ]]))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--wait-interval', '1', 'DATABASE_URL',
    ])

    expect(fakeData.database.waitForReadyForApp.calledOnceWithExactly('myapp', 'DATABASE_URL', match({waitIntervalMs: 1000}))).to.equal(true)
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Waiting for database postgres-1... available')
  })

  it('starts and completes the spinner for each waiting database', async function () {
    fakeData.database.waitForReadyForApp.callsFake(waitThrough([
      [
        {addon, status: {message: 'pending', 'waiting?': true}},
        {addon, status: {message: 'available', 'waiting?': false}},
      ],
      [
        {addon: otherAddon, status: {message: 'pending', 'waiting?': true}},
        {addon: otherAddon, status: {message: 'available', 'waiting?': false}},
      ],
    ]))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.equal('Waiting for database postgres-1... available\nWaiting for database postgres-2... available\n')
  })

  it('waits for all databases sequentially without emitting output when immediately available', async function () {
    fakeData.database.waitForReadyForApp.callsFake(waitThrough([
      [{addon, status: {'waiting?': false}}],
      [{addon: otherAddon, status: {'waiting?': false}}],
    ]))

    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'myapp'])

    expect(fakeData.database.waitForReadyForApp.calledOnceWithExactly('myapp', undefined, match.object)).to.equal(true)
    expect(stdout).to.equal('')
    expect(stderr).to.equal('')
  })

  it('displays errors and notifies even when --no-notify is passed', async function () {
    const notifyStub = sandbox.stub(Cmd, 'notifier')
    const error = new LegacyDatabaseWaitError(addon, {'error?': true, message: 'this is an error message', 'waiting?': false})
    fakeData.database.waitForReadyForApp.rejects(error)

    const {error: commandError} = await runCommand(Cmd, ['--app', 'myapp', '--no-notify'])
    const {message, oclif} = commandError as Errors.CLIError

    expect(message).to.equal('this is an error message')
    expect(oclif.exit).to.equal(1)
    expect(notifyStub.calledOnceWithExactly('error', 'postgres-1 this is an error message', false)).to.equal(true)
  })

  it('receives steps but does not display them', async function () {
    fakeData.database.waitForReadyForApp.callsFake(waitThrough([[
      {addon, status: {message: 'upgrading', step: '1/3', 'waiting?': true}},
      {addon, status: {message: 'available', 'waiting?': false}},
    ]]))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app', 'myapp', '--wait-interval', '1', 'DATABASE_URL',
    ])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Waiting for database postgres-1... available')
    expect(stderr).to.not.contain('1/3')
  })

  it('defaults invalid, zero, and negative wait intervals to five seconds', async function () {
    fakeData.database.waitForReadyForApp.resolves({databases: []})

    await runCommand(Cmd, ['--app', 'myapp', '--wait-interval', 'invalid', 'DATABASE_URL'])
    expect(fakeData.database.waitForReadyForApp.firstCall.args[2].waitIntervalMs).to.equal(5000)

    await runCommand(Cmd, ['--app', 'myapp', '--wait-interval', '0', 'DATABASE_URL'])
    expect(fakeData.database.waitForReadyForApp.secondCall.args[2].waitIntervalMs).to.equal(5000)

    await runCommand(Cmd, ['--app', 'myapp', '--wait-interval', '-1', 'DATABASE_URL'])
    expect(fakeData.database.waitForReadyForApp.thirdCall.args[2].waitIntervalMs).to.equal(5000)
  })
})
