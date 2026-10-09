import type {RestoreAndWaitOptions} from '@heroku/sdk/extensions/data'

import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/restore.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc
const addon = {
  app: {name: 'myapp'},
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}

type FakeData = {
  restore: {restoreAndWait: SinonStub}
  transfer: {listByApp: SinonStub}
}

function buildFakeData(): FakeData {
  return {
    restore: {restoreAndWait: stub()},
    transfer: {listByApp: stub()},
  }
}

function fakeRestoreAndWait(addon: Record<string, unknown>, transfer: Record<string, unknown>) {
  return async (
    _app: string,
    _database: string | undefined,
    _backupUrl: string,
    options: RestoreAndWaitOptions = {},
  ) => {
    const database = addon as never
    const info = transfer as never

    options.restorePoller?.onStart?.(database)
    options.restorePoller?.onStop?.(database)
    options.waitPoller?.onStart?.(info)
    options.onPoll?.(info)
    options.waitPoller?.onStop?.(info)

    return transfer
  }
}

describe('pg:backups:restore', function () {
  let fakeData: FakeData
  let sdkMock: MockSDK

  beforeEach(function () {
    fakeData = buildFakeData()
    sdkMock = mockSDKData(fakeData)
  })

  afterEach(function () {
    sdkMock.restore()
  })

  context('b005', function () {
    beforeEach(function () {
      fakeData.transfer.listByApp.resolves([
        {
          from_type: 'pg_dump', num: 5, succeeded: true, to_type: 'gof3r', to_url: 'https://myurl',
        },
      ])
      fakeData.restore.restoreAndWait.callsFake(fakeRestoreAndWait(
        addon,
        {finished_at: '101', succeeded: true, uuid: '100-001'},
      ))
    })

    it('restores a db', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
      ])
      expect(stdout).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))
      expect(stderr).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
      expect(fakeData.restore.restoreAndWait.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', undefined, 'https://myurl'])
    })

    it('restores a specific db', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'b005',
      ])
      expect(stdout).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))
      expect(stderr).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
      expect(fakeData.restore.restoreAndWait.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', undefined, 'https://myurl'])
    })

    it('restores a specific app db', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'myapp::b005',
      ])
      expect(stdout).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))
      expect(stderr).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
      expect(fakeData.restore.restoreAndWait.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', undefined, 'https://myurl'])
    })
  })

  context('b005 (verbose)', function () {
    beforeEach(function () {
      fakeData.transfer.listByApp.resolves([
        {
          from_type: 'pg_dump', num: 5, succeeded: true, to_type: 'gof3r', to_url: 'https://myurl',
        },
      ])
      fakeData.restore.restoreAndWait.callsFake(fakeRestoreAndWait(
        addon,
        {
          finished_at: '101', logs: [{created_at: '100', message: 'log message 1'}], succeeded: true, uuid: '100-001',
        },
      ))
    })

    it('shows verbose output', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--verbose',
      ])
      expect(stdout).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      Restoring...
      100 log message 1
      `))

      expect(stderr).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
    })
  })

  context('with a URL', function () {
    beforeEach(function () {
      fakeData.restore.restoreAndWait.callsFake(fakeRestoreAndWait(
        addon,
        {finished_at: '101', succeeded: true, uuid: '100-001'},
      ))
    })

    it('restores a db from a URL', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'https://www.dropbox.com',
      ])
      expect(stdout).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))

      expect(stderr).to.equal(heredoc(`
      Starting restore of https://www.dropbox.com to ⛁ postgres-1... done
      Restoring... done
      `))
      expect(fakeData.transfer.listByApp.called).to.equal(false)
      expect(fakeData.restore.restoreAndWait.firstCall.args.slice(0, 3)).to.deep.equal(['myapp', undefined, 'https://www.dropbox.com?dl=1'])
    })
  })

  context('with extensions', function () {
    beforeEach(function () {
      fakeData.transfer.listByApp.resolves([
        {
          from_type: 'pg_dump', num: 5, succeeded: true, to_type: 'gof3r', to_url: 'https://myurl',
        },
      ])
      fakeData.restore.restoreAndWait.callsFake(fakeRestoreAndWait(
        addon,
        {finished_at: '101', succeeded: true, uuid: '100-001'},
      ))
    })

    it('restores a db with pre-installed extensions', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--extensions',
        'uuid-ossp, Postgis',
      ])
      expect(stdout).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))

      expect(stderr).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
      expect(fakeData.restore.restoreAndWait.firstCall.args[3]).to.deep.include({extensions: ['postgis', 'uuid-ossp']})
    })
  })
})
