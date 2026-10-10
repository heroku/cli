import type {CaptureAndWaitOptions} from '@heroku/sdk/extensions/data'

import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/capture.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

type FakeData = {
  backup: {captureAndWait: SinonStub}
  database: {describe: SinonStub}
}

function buildFakeData(): FakeData {
  return {
    backup: {captureAndWait: stub()},
    database: {describe: stub()},
  }
}

function fakeCaptureAndWait(addon: Record<string, unknown>, transfer: Record<string, unknown>) {
  return async (_app: string, _database: string | undefined, options: CaptureAndWaitOptions = {}) => {
    const database = addon as never
    const info = transfer as never

    options.capturePoller?.onStart?.(database)
    options.capturePoller?.onStop?.(database)
    options.waitPoller?.onStart?.(info)
    options.onPoll?.(info)
    options.waitPoller?.onStop?.(info)

    return transfer
  }
}

describe('pg:backups:capture', function () {
  const addon = {
    app: {name: 'myapp'}, id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
  }
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('captures a db', async function () {
    const transfer = {
      finished_at: '101', from_name: 'DATABASE', num: 5, succeeded: true, uuid: '100-001',
    }

    fakeData.database.describe.resolves({
      info: [
        {name: 'Continuous Protection', values: ['On']},
      ],
    })
    fakeData.backup.captureAndWait.callsFake(fakeCaptureAndWait(addon, transfer))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

    `)
    expect(stderr).to.match(new RegExp(heredoc`
      Starting backup of ⛁ postgres-1... done
      Backing up ⛁ DATABASE to b005... done
    `))
    expect(stderr).to.match(/backups of large databases are likely to fail/)
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(fakeData.database.describe.calledOnceWithExactly('myapp', undefined)).to.equal(true)
    expect(fakeData.backup.captureAndWait.firstCall.args[0]).to.equal('myapp')
    expect(fakeData.backup.captureAndWait.firstCall.args[1]).to.equal(undefined)
  })

  it('captures a db (verbose)', async function () {
    const transfer = {
      finished_at: '101', from_name: 'DATABASE', logs: [{created_at: '100', message: 'log message 1'}], num: 5, succeeded: true, uuid: '100-001',
    }

    fakeData.database.describe.resolves({
      info: [
        {name: 'Continuous Protection', values: ['Off']},
      ],
    })
    fakeData.backup.captureAndWait.callsFake(fakeCaptureAndWait(addon, transfer))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])

    expect(stdout).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

      Backing up ⛁ DATABASE to b005...
      100 log message 1
    `)
    expect(stderr).to.match(/Starting backup of ⛁ postgres-1... done/)
    expect(stderr).not.to.match(/backups of large databases are likely to fail/)
  })

  it('captures a db (verbose) with non billing app', async function () {
    addon.app.name = 'mybillingapp'
    const transfer = {
      finished_at: '101', from_name: 'DATABASE', logs: [{created_at: '100', message: 'log message 1'}], num: 5, succeeded: true, uuid: '100-001',
    }

    fakeData.database.describe.resolves({
      info: [
        {name: 'Continuous Protection', values: ['On']},
      ],
    })
    fakeData.backup.captureAndWait.callsFake(fakeCaptureAndWait(addon, transfer))

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--verbose',
    ])

    expect(stdout).to.equal(heredoc`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
      Use heroku pg:backups:info to check progress.
      Stop a running backup with heroku pg:backups:cancel.

      HINT: You are running this command with a non-billing application.
      Use heroku pg:backups -a mybillingapp to check the list of backups.

      Backing up ⛁ DATABASE to b005...
      100 log message 1
    `)
    expect(stderr).to.match(/Starting backup of ⛁ postgres-1... done/)
    expect(stderr).to.match(/backups of large databases are likely to fail/)
  })
})
