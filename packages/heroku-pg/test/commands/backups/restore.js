'use strict'
/* global describe it beforeEach afterEach context */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}}
const fetcher = () => {
  return {
    addon: () => addon
  }
}

const cmd = proxyquire('../../../commands/backups/restore', {
  '../../lib/fetcher': fetcher
})

describe('pg:backups:restore', () => {
  let pg

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  context('b005', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {num: 5, from_type: 'pg_dump', to_type: 'gof3r', succeeded: true, to_url: 'https://myurl'}
      ])
      pg.post('/client/v11/databases/postgres-1/restores', {backup_url: 'https://myurl'}).reply(200, {
        num: 5,
        from_name: 'DATABASE',
        uuid: '100-001'
      })
      pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {
        finished_at: '101',
        succeeded: true,
        logs: [{created_at: '100', message: 'log message 1'}]
      })
    })

    it('restores a db', () => {
      return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout, 'to equal', `
Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
Use heroku pg:backups to check progress.
Stop a running restore with heroku pg:backups:cancel.

`))
      .then(() => expect(cli.stderr, 'to equal', `Starting restore of b005 to postgres-1... done
Restoring... pending
100 log message 1
Restoring... done
`))
    })

    it('shows verbose output', () => {
      return cmd.run({app: 'myapp', args: {}, flags: {confirm: 'myapp', verbose: true}})
      .then(() => expect(cli.stdout, 'to equal', `
Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
Use heroku pg:backups to check progress.
Stop a running restore with heroku pg:backups:cancel.

Restoring...
100 log message 1
`))
      .then(() => expect(cli.stderr, 'to equal', 'Starting restore of b005 to postgres-1... done\n'))
    })

    it('restores a specific db', () => {
      return cmd.run({app: 'myapp', args: {backup: 'b005'}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout, 'to equal', `
Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
Use heroku pg:backups to check progress.
Stop a running restore with heroku pg:backups:cancel.

`))
      .then(() => expect(cli.stderr, 'to equal', `Starting restore of b005 to postgres-1... done
Restoring... pending
100 log message 1
Restoring... done
`))
    })

    it('restores a specific app db', () => {
      return cmd.run({app: 'myapp', args: {backup: 'myapp::b005'}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout, 'to equal', `
Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
Use heroku pg:backups to check progress.
Stop a running restore with heroku pg:backups:cancel.

`))
      .then(() => expect(cli.stderr, 'to equal', `Starting restore of b005 to postgres-1... done
Restoring... pending
100 log message 1
Restoring... done
`))
    })
  })

  context('with a URL', () => {
    beforeEach(() => {
      pg.post('/client/v11/databases/postgres-1/restores', {backup_url: 'https://www.dropbox.com?dl=1'}).reply(200, {
        num: 5,
        from_name: 'DATABASE',
        uuid: '100-001'
      })
      pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {
        finished_at: '101',
        succeeded: true,
        logs: []
      })
    })

    it('restores a db from a URL', () => {
      return cmd.run({app: 'myapp', args: {backup: 'https://www.dropbox.com'}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout, 'to equal', `
Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
Use heroku pg:backups to check progress.
Stop a running restore with heroku pg:backups:cancel.

`))
      .then(() => expect(cli.stderr, 'to equal', `Starting restore of https://www.dropbox.com to postgres-1... done
Restoring... pending
Restoring... done
`))
    })
  })
})
