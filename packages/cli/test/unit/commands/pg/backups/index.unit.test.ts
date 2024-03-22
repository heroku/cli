import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/pg/backups/index'
import type {BackupTransfer} from '../../../../../src/lib/pg/backups'
import runCommand from '../../../../helpers/runCommand'

describe('pg:backups', () => {
  let pg: nock.Scope
  let transfers: BackupTransfer[]
  beforeEach(() => {
    pg = nock('https://api.data.heroku.com')
    pg.get('/client/v11/apps/myapp/transfers')
      .reply(200, transfers)
  })
  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })
  describe('with no backups/restores/copies', () => {
    before(() => {
      transfers = []
    })

    it('shows empty message', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== Backups\n\nNo backups. Capture one with heroku pg:backups:capture\n\n=== Restores\n\nNo restores found. Use heroku pg:backups:restore to restore a backup\n\n=== Copies\n\nNo copies found. Use heroku pg:copy to copy a database to another\n\n')
    })
  })

  describe('with backups', () => {
    before(() => {
      transfers = [
        {
          num: 3,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          succeeded: true,
          warnings: 2,
          created_at: '2016-10-01 00:42:54 +0000',
          updated_at: '2016-10-08 00:43:04 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
        } as BackupTransfer, {
          num: 10,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          succeeded: true,
          warnings: 0,
          created_at: '2016-10-02 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          schedule: {uuid: '5e5d5bc9-6aed-4ede-81b5-edf9341ee6d2'},
        } as BackupTransfer, {
          num: 4,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          created_at: '2016-10-03 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
        } as BackupTransfer, {
          num: 5,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          created_at: '2016-10-04 00:42:54 +0000',
        } as BackupTransfer, {
          num: 6,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          created_at: '2016-10-05 00:42:54 +0000',
          started_at: '2016-10-08 00:42:54 +0000',
        } as BackupTransfer,
      ]
    })

    it('shows backups', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal(heredoc(`=== Backups

 Id   Created at                Status                              Size   Database 
 ──── ───────────────────────── ─────────────────────────────────── ────── ──────── 
 b006 2016-10-05 00:42:54 +0000 Running (processed 1.40KB)          1.40KB DATABASE 
 b005 2016-10-04 00:42:54 +0000 Pending                             1.40KB DATABASE 
 b004 2016-10-03 00:42:54 +0000 Failed 2016-10-08 00:43:00 +0000    1.40KB DATABASE 
 a010 2016-10-02 00:42:54 +0000 Completed 2016-10-08 00:43:00 +0000 1.40KB DATABASE 
 b003 2016-10-01 00:42:54 +0000 Finished with 2 warnings            1.40KB DATABASE 

=== Restores

No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies

No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  describe('with restore', () => {
    before(() => {
      transfers = [
        {
          num: 3,
          to_name: 'IVORY',
          to_type: 'pg_restore',
          processed_bytes: 1437,
          succeeded: true,
          warnings: 0,
          created_at: '2016-10-08 00:42:54 +0000',
          updated_at: '2016-10-08 00:43:04 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
        } as BackupTransfer,
      ]
    })

    it('shows restore', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal(heredoc(`=== Backups

No backups. Capture one with heroku pg:backups:capture

=== Restores

 Id   Started at                Status                              Size   Database 
 ──── ───────────────────────── ─────────────────────────────────── ────── ──────── 
 r003 2016-10-08 00:42:54 +0000 Completed 2016-10-08 00:43:00 +0000 1.40KB IVORY    

=== Copies

No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  describe('with copy', () => {
    before(() => {
      transfers = [
        {
          num: 3,
          from_name: 'RED',
          to_name: 'IVORY',
          from_type: 'pg_dump',
          to_type: 'pg_restore',
          processed_bytes: 1437,
          succeeded: true,
          warnings: 0,
          created_at: '2016-10-08 00:42:54 +0000',
          updated_at: '2016-10-08 00:43:04 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
        } as BackupTransfer,
      ]
    })

    it('shows copy', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal(heredoc(`=== Backups

No backups. Capture one with heroku pg:backups:capture

=== Restores

No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies

 Id   Started at                Status                              Size   From To    
 ──── ───────────────────────── ─────────────────────────────────── ────── ──── ───── 
 c003 2016-10-08 00:42:54 +0000 Completed 2016-10-08 00:43:00 +0000 1.40KB RED  IVORY 

`))
    })
  })
})
