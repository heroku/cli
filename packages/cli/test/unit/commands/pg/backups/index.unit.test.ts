import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import type {BackupTransfer} from '../../../../../src/lib/pg/types.js'

import Cmd from '../../../../../src/commands/pg/backups/index.js'
import runCommand from '../../../../helpers/runCommand.js'
import normalizeTableOutput from '../../../../helpers/utils/normalizeTableOutput.js'

const heredoc = tsheredoc.default

describe('pg:backups', function () {
  let pg: nock.Scope
  let transfers: BackupTransfer[]

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
    pg.get('/client/v11/apps/myapp/transfers')
      .reply(200, transfers)
  })

  afterEach(function () {
    nock.cleanAll()
    pg.done()
  })

  describe('with no backups/restores/copies', function () {
    before(function () {
      transfers = []
    })

    it('shows empty message', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal(heredoc(`
      === Backups

      No backups. Capture one with heroku pg:backups:capture

      === Restores

      No restores found. Use heroku pg:backups:restore to restore a backup

      === Copies

      No copies found. Use heroku pg:copy to copy a database to another

      `))
    })
  })

  describe('with backups', function () {
    before(function () {
      transfers = [
        {
          created_at: '2016-10-01 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          num: 3,
          processed_bytes: 1437,
          succeeded: true,
          to_type: 'gof3r',
          updated_at: '2016-10-08 00:43:04 +0000',
          warnings: 2,
        } as BackupTransfer, {
          created_at: '2016-10-02 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          num: 10,
          processed_bytes: 1437,
          schedule: {uuid: '5e5d5bc9-6aed-4ede-81b5-edf9341ee6d2'},
          succeeded: true,
          to_type: 'gof3r',
          warnings: 0,
        } as BackupTransfer, {
          created_at: '2016-10-03 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          num: 4,
          processed_bytes: 1437,
          to_type: 'gof3r',
        } as BackupTransfer, {
          created_at: '2016-10-04 00:42:54 +0000',
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          num: 5,
          processed_bytes: 1437,
          to_type: 'gof3r',
        } as BackupTransfer, {
          created_at: '2016-10-05 00:42:54 +0000',
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          num: 6,
          processed_bytes: 1437,
          started_at: '2016-10-08 00:42:54 +0000',
          to_type: 'gof3r',
        } as BackupTransfer,
      ]
    })

    it('shows backups', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(normalizeTableOutput(stdout.output)).to.equal(normalizeTableOutput(`=== Backups

 Id   Created at                Status                              Size   Database
 ──── ───────────────────────── ─────────────────────────────────── ────── ────────
 b006 2016-10-05 00:42:54 +0000 Running (processed 1.40KB)          1.40KB ⛁ DATABASE
 b005 2016-10-04 00:42:54 +0000 Pending                             1.40KB ⛁ DATABASE
 b004 2016-10-03 00:42:54 +0000 Failed 2016-10-08 00:43:00 +0000    1.40KB ⛁ DATABASE
 a010 2016-10-02 00:42:54 +0000 Completed 2016-10-08 00:43:00 +0000 1.40KB ⛁ DATABASE
 b003 2016-10-01 00:42:54 +0000 Finished with 2 warnings            1.40KB ⛁ DATABASE

=== Restores

No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies

No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  describe('with restore', function () {
    before(function () {
      transfers = [
        {
          created_at: '2016-10-08 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          num: 3,
          processed_bytes: 1437,
          succeeded: true,
          to_name: 'IVORY',
          to_type: 'pg_restore',
          updated_at: '2016-10-08 00:43:04 +0000',
          warnings: 0,
        } as BackupTransfer,
      ]
    })

    it('shows restore', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(normalizeTableOutput(stdout.output)).to.equal(normalizeTableOutput(`=== Backups

No backups. Capture one with heroku pg:backups:capture

=== Restores

 Id   Started at                Status                              Size   Database
 ──── ───────────────────────── ─────────────────────────────────── ────── ────────
 r003 2016-10-08 00:42:54 +0000 Completed 2016-10-08 00:43:00 +0000 1.40KB ⛁ IVORY

=== Copies

No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  describe('with copy', function () {
    before(function () {
      transfers = [
        {
          created_at: '2016-10-08 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          from_name: 'RED',
          from_type: 'pg_dump',
          num: 3,
          processed_bytes: 1437,
          succeeded: true,
          to_name: 'IVORY',
          to_type: 'pg_restore',
          updated_at: '2016-10-08 00:43:04 +0000',
          warnings: 0,
        } as BackupTransfer,
      ]
    })

    it('shows copy', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(normalizeTableOutput(stdout.output)).to.equal(normalizeTableOutput(`=== Backups

No backups. Capture one with heroku pg:backups:capture

=== Restores

No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies

 Id   Started at                Status                              Size   From To
 ──── ───────────────────────── ─────────────────────────────────── ────── ──── ─────
 c003 2016-10-08 00:42:54 +0000 Completed 2016-10-08 00:43:00 +0000 1.40KB ⛁ RED  ⛁ IVORY

`))
    })
  })
})
