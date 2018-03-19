'use strict'
/* global describe it before beforeEach afterEach context */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups')

describe('pg:backups', () => {
  let pg, transfers

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    pg.get('/client/v11/apps/myapp/transfers').reply(200, transfers)
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  context('with no backups/restores/copies', () => {
    before(() => {
      transfers = []
    })

    it('shows empty message', () => {
      return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout, 'to equal', `=== Backups
No backups. Capture one with heroku pg:backups:capture

=== Restores
No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies
No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  context('with backups', () => {
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
          created_at: '2016-10-08 00:42:54 +0000',
          updated_at: '2016-10-08 00:43:04 +0000',
          finished_at: '2016-10-08 00:43:00 +0000'
        },
        {
          num: 10,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          succeeded: true,
          warnings: 0,
          created_at: '2016-10-08 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000',
          schedule: { uuid: '5e5d5bc9-6aed-4ede-81b5-edf9341ee6d2' }
        },
        {
          num: 4,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          created_at: '2016-10-08 00:42:54 +0000',
          finished_at: '2016-10-08 00:43:00 +0000'
        },
        {
          num: 5,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          created_at: '2016-10-08 00:42:54 +0000'
        },
        {
          num: 6,
          from_name: 'DATABASE',
          from_type: 'pg_dump',
          to_type: 'gof3r',
          processed_bytes: 1437,
          created_at: '2016-10-08 00:42:54 +0000',
          started_at: '2016-10-08 00:42:54 +0000'
        }
      ]
    })

    it('shows backups', () => {
      return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout, 'to equal', `=== Backups
ID    Created at                 Status                               Size    Database
────  ─────────────────────────  ───────────────────────────────────  ──────  ────────
b006  2016-10-08 00:42:54 +0000  Running (processed 1.40KB)           1.40KB  DATABASE
b005  2016-10-08 00:42:54 +0000  Pending                              1.40KB  DATABASE
b004  2016-10-08 00:42:54 +0000  Failed 2016-10-08 00:43:00 +0000     1.40KB  DATABASE
a010  2016-10-08 00:42:54 +0000  Completed 2016-10-08 00:43:00 +0000  1.40KB  DATABASE
b003  2016-10-08 00:42:54 +0000  Finished with 2 warnings             1.40KB  DATABASE

=== Restores
No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies
No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  context('with restore', () => {
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
          finished_at: '2016-10-08 00:43:00 +0000'
        }
      ]
    })

    it('shows restore', () => {
      return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout, 'to equal', `=== Backups
No backups. Capture one with heroku pg:backups:capture

=== Restores
ID    Started at                 Status                               Size    Database
────  ─────────────────────────  ───────────────────────────────────  ──────  ────────
r003  2016-10-08 00:42:54 +0000  Completed 2016-10-08 00:43:00 +0000  1.40KB  IVORY

=== Copies
No copies found. Use heroku pg:copy to copy a database to another

`))
    })
  })

  context('with copy', () => {
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
          finished_at: '2016-10-08 00:43:00 +0000'
        }
      ]
    })

    it('shows copy', () => {
      return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout, 'to equal', `=== Backups
No backups. Capture one with heroku pg:backups:capture

=== Restores
No restores found. Use heroku pg:backups:restore to restore a backup

=== Copies
ID    Started at                 Status                               Size    From  To
────  ─────────────────────────  ───────────────────────────────────  ──────  ────  ─────
c003  2016-10-08 00:42:54 +0000  Completed 2016-10-08 00:43:00 +0000  1.40KB  RED   IVORY

`))
    })
  })
})

describe('pg:backups', () => {
  const infoCmd = require('../../..').commands.find((c) => c.topic === 'pg' && c.command === 'backups:info')

  it('errors out when subcommand not found', () => {
    return expect(require('./helpers.js').dup('foobar', infoCmd)({}), 'to be rejected with', 'Unknown pg:backups command: foobar')
  })
})
