'use strict'
/* global describe it beforeEach afterEach context */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:info')

describe('pg:backups:info', () => {
  let pg

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  context('without specifying a backup and no backups', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [])
    })

    it('shows error message', () => {
      return expect(cmd.run({app: 'myapp', args: {}})
        , 'to be rejected with', 'No backups. Capture one with heroku pg:backups:capture')
    })
  })

  context('with specifying a backup', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers/3?verbose=true').reply(200, {
        num: 3,
        source_bytes: 1000000,
        processed_bytes: 100000,
        from_name: 'RED',
        logs: [{created_at: '100', message: 'foo'}]
      })
    })

    it('shows the backup', () => {
      return cmd.run({app: 'myapp', args: {backup_id: 'b003'}})
      .then(() => expect(cli.stdout, 'to equal', `=== Backup b003
Database:         RED
Status:           Pending
Type:             Manual
Original DB Size: 976.56 KB
Backup Size:      97.66 KB

=== Backup Logs
100 foo

`))
    })
  })

  context('with specifying a legacy backup', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {name: 'ob001', num: 1, from_type: 'pg_dump', to_type: 'gof3r', options: {pgbackups_name: 'b001'}}
      ])
      pg.get('/client/v11/apps/myapp/transfers/1?verbose=true').reply(200, {
        name: 'ob001',
        options: {pgbackups_name: 'b001'},
        num: 1,
        source_bytes: 1000000,
        processed_bytes: 100000,
        from_name: 'RED',
        logs: [{created_at: '100', message: 'foo'}]
      })
    })

    it('shows the backup', () => {
      return cmd.run({app: 'myapp', args: {backup_id: 'ob001'}})
      .then(() => expect(cli.stdout, 'to equal', `=== Backup ob001
Database:         RED
Status:           Pending
Type:             Manual
Original DB Size: 976.56 KB
Backup Size:      97.66 KB

=== Backup Logs
100 foo

`))
    })
  })

  context('without specifying a backup', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {num: 3, from_type: 'pg_dump', to_type: 'gof3r'}
      ])
      pg.get('/client/v11/apps/myapp/transfers/3?verbose=true').reply(200, {
        num: 3,
        source_bytes: 1000000,
        processed_bytes: 100000,
        from_name: 'RED',
        finished_at: '100',
        succeeded: true,
        logs: [{created_at: '100', message: 'foo'}]
      })
    })

    it('shows the latest backup', () => {
      return cmd.run({app: 'myapp', args: {}})
      .then(() => expect(cli.stdout, 'to equal', `=== Backup b003
Database:         RED
Finished at:      100
Status:           Completed
Type:             Manual
Original DB Size: 976.56 KB
Backup Size:      97.66 KB (90% compression)

=== Backup Logs
100 foo

`))
    })
  })
})
