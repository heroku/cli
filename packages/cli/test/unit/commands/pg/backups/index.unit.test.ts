import {expect} from '@oclif/test'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'
import Cmd from '../../../../../src/commands/pg/backups/index.js'
import type {BackupTransfer} from '../../../../../src/lib/pg/types.js'
import runCommand from '../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

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
      const actual = removeAllWhitespace(stdout.output)
      expect(actual).to.include(removeAllWhitespace('=== Backups'))
      expect(actual).to.include(removeAllWhitespace('No backups. Capture one with heroku pg:backups:capture'))
      expect(actual).to.include(removeAllWhitespace('=== Restores'))
      expect(actual).to.include(removeAllWhitespace('No restores found. Use heroku pg:backups:restore to restore a backup'))
      expect(actual).to.include(removeAllWhitespace('=== Copies'))
      expect(actual).to.include(removeAllWhitespace('No copies found. Use heroku pg:copy to copy a database to another'))
    })
  })

  describe('with backups', function () {
    before(function () {
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

    it('shows backups', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      const actual = removeAllWhitespace(stdout.output)
      expect(actual).to.include(removeAllWhitespace('=== Backups'))
      expect(actual).to.include(removeAllWhitespace('ID'))
      expect(actual).to.include(removeAllWhitespace('Created at'))
      expect(actual).to.include(removeAllWhitespace('Status'))
      expect(actual).to.include(removeAllWhitespace('Size'))
      expect(actual).to.include(removeAllWhitespace('Database'))
      expect(actual).to.include(removeAllWhitespace('b006'))
      expect(actual).to.include(removeAllWhitespace('b005'))
      expect(actual).to.include(removeAllWhitespace('b004'))
      expect(actual).to.include(removeAllWhitespace('a010'))
      expect(actual).to.include(removeAllWhitespace('b003'))
      expect(actual).to.include(removeAllWhitespace('DATABASE'))
      expect(actual).to.include(removeAllWhitespace('=== Restores'))
      expect(actual).to.include(removeAllWhitespace('No restores found. Use heroku pg:backups:restore to restore a backup'))
      expect(actual).to.include(removeAllWhitespace('=== Copies'))
      expect(actual).to.include(removeAllWhitespace('No copies found. Use heroku pg:copy to copy a database to another'))
    })
  })

  describe('with restore', function () {
    before(function () {
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

    it('shows restore', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      const actual = removeAllWhitespace(stdout.output)
      expect(actual).to.include(removeAllWhitespace('=== Backups'))
      expect(actual).to.include(removeAllWhitespace('No backups. Capture one with heroku pg:backups:capture'))
      expect(actual).to.include(removeAllWhitespace('=== Restores'))
      expect(actual).to.include(removeAllWhitespace('ID'))
      expect(actual).to.include(removeAllWhitespace('Started at'))
      expect(actual).to.include(removeAllWhitespace('r003'))
      expect(actual).to.include(removeAllWhitespace('IVORY'))
      expect(actual).to.include(removeAllWhitespace('=== Copies'))
      expect(actual).to.include(removeAllWhitespace('No copies found. Use heroku pg:copy to copy a database to another'))
    })
  })

  describe('with copy', function () {
    before(function () {
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

    it('shows copy', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      const actual = removeAllWhitespace(stdout.output)
      expect(actual).to.include(removeAllWhitespace('=== Backups'))
      expect(actual).to.include(removeAllWhitespace('No backups. Capture one with heroku pg:backups:capture'))
      expect(actual).to.include(removeAllWhitespace('=== Restores'))
      expect(actual).to.include(removeAllWhitespace('No restores found. Use heroku pg:backups:restore to restore a backup'))
      expect(actual).to.include(removeAllWhitespace('=== Copies'))
      expect(actual).to.include(removeAllWhitespace('ID'))
      expect(actual).to.include(removeAllWhitespace('Started at'))
      expect(actual).to.include(removeAllWhitespace('From'))
      expect(actual).to.include(removeAllWhitespace('To'))
      expect(actual).to.include(removeAllWhitespace('c003'))
      expect(actual).to.include(removeAllWhitespace('RED'))
      expect(actual).to.include(removeAllWhitespace('IVORY'))
    })
  })
})
