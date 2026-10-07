import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/info.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:backups:info', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    restore()
  })

  context('without specifying a backup and no backups', function () {
    beforeEach(function () {
      sdkMock = mockSDKData({
        transfer: {listByApp: stub().resolves([])},
      })
    })

    it('shows error message', async function () {
      const {error} = await runCommand(Cmd, ['--app', 'myapp'])
      const errorMessage = error?.message ?? ''
      expect(ansis.strip(errorMessage)).to.equal('No backups. Capture one with heroku pg:backups:capture')
    })
  })

  context('with specifying a backup', function () {
    beforeEach(function () {
      sdkMock = mockSDKData({
        transfer: {
          infoByApp: stub().resolves({
            from_name: 'RED', logs: [{created_at: '100', message: 'foo'}], num: 3, processed_bytes: 100_000, source_bytes: 1_000_000,
          }),
        },
      })
    })

    it('shows the backup', async function () {
      const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'b003'])
      expectOutput(stdout, heredoc(`
        === Backup b003
        Database:         ⛁ RED
        Status:           Pending
        Type:             Manual
        Original DB Size: 976.56KB
        Backup Size:      97.66KB

        === Backup Logs
        100 foo

      `))
    })
  })

  context('with specifying a legacy backup', function () {
    beforeEach(function () {
      sdkMock = mockSDKData({
        transfer: {
          infoByApp: stub().resolves({
            from_name: 'RED', logs: [{created_at: '100', message: 'foo'}], name: 'ob001', num: 1, options: {pgbackups_name: 'b001'}, processed_bytes: 100_000, source_bytes: 1_000_000,
          }),
          listByApp: stub().resolves([
            {
              from_type: 'pg_dump', name: 'ob001', num: 1, options: {pgbackups_name: 'b001'}, to_type: 'gof3r',
            },
          ]),
        },
      })
    })

    it('shows the backup', async function () {
      const {stdout} = await runCommand(Cmd, ['--app', 'myapp', 'ob001'])
      expectOutput(stdout, heredoc(`
        === Backup ob001
        Database:         ⛁ RED
        Status:           Pending
        Type:             Manual
        Original DB Size: 976.56KB
        Backup Size:      97.66KB

        === Backup Logs
        100 foo

      `))
    })
  })

  context('without specifying a backup', function () {
    beforeEach(function () {
      sdkMock = mockSDKData({
        transfer: {
          infoByApp: stub().resolves({
            finished_at: '100', from_name: 'RED', logs: [{created_at: '100', message: 'foo'}], num: 3, processed_bytes: 100_000, source_bytes: 1_000_000, succeeded: true,
          }),
          listByApp: stub().resolves([
            {from_type: 'pg_dump', num: 3, to_type: 'gof3r'},
          ]),
        },
      })
    })

    it('shows the latest backup', async function () {
      const {stdout} = await runCommand(Cmd, ['--app', 'myapp'])
      expectOutput(stdout, heredoc(`
        === Backup b003
        Database:         ⛁ RED
        Finished at:      100
        Status:           Completed
        Type:             Manual
        Original DB Size: 976.56KB
        Backup Size:      97.66KB (90% compression)

        === Backup Logs
        100 foo

      `))
    })
  })
})
