'use strict'
/* global afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')

const addon = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}, app: {name: 'myapp'}}

const cmd = require('../../../../commands/backups/capture')

let captureText = () => {
  if (process.stderr.isTTY) {
    return 'Backing up DATABASE to b005... pending\nBacking up DATABASE to b005... done\n'
  }

  return 'Backing up DATABASE to b005... done\n'
}

const shouldCapture = function (cmdRun) {
  let pg
  let api

  afterEach(() => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  it('captures a db', () => {
    addon.app.name = 'myapp'
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon}])
    pg = nock('https://api.data.heroku.com')
    pg.post('/client/v11/databases/1/backups').reply(200, {
      num: 5,
      from_name: 'DATABASE',
      uuid: '100-001',
    })
    pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {
      finished_at: '101',
      succeeded: true,
    })

    let dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    pg.get('/client/v11/databases/1').reply(200, dbA)

    cli.mockConsole()

    return cmdRun({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`
Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
Use heroku pg:backups:info to check progress.
Stop a running backup with heroku pg:backups:cancel.

`))
      .then(() => expect(cli.stderr, 'to match', new RegExp(`Starting backup of postgres-1... done\n${captureText()}`)))
    // eslint-disable-next-line prefer-regex-literals
      .then(() => expect(cli.stderr, 'to match', new RegExp('backups of large databases are likely to fail')))
  })

  it('captures a db (verbose)', () => {
    addon.app.name = 'myapp'
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon}])

    pg = nock('https://api.data.heroku.com')
    pg.post('/client/v11/databases/1/backups').reply(200, {
      num: 5,
      from_name: 'DATABASE',
      uuid: '100-001',
    })
    pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true').reply(200, {
      finished_at: '101',
      succeeded: true,
      logs: [{created_at: '100', message: 'log message 1'}],
    })

    let dbA = {info: [
      {name: 'Continuous Protection', values: ['Off']},
    ]}
    pg.get('/client/v11/databases/1').reply(200, dbA)

    cli.mockConsole()

    return cmdRun({app: 'myapp', args: {}, flags: {verbose: true}})
      .then(() => expect(cli.stdout).to.equal(`
Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
Use heroku pg:backups:info to check progress.
Stop a running backup with heroku pg:backups:cancel.

Backing up DATABASE to b005...
100 log message 1
`))
    // eslint-disable-next-line prefer-regex-literals
      .then(() => expect(cli.stderr, 'to match', new RegExp(`Starting backup of postgres-1... done
`))).then(() => expect(cli.stderr, 'not to match', new RegExp('backups of large databases are likely to fail'))) // eslint-disable-line prefer-regex-literals
  })

  it('captures a db (verbose) with non billing app', () => {
    addon.app.name = 'mybillingapp'
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon}])

    pg = nock('https://api.data.heroku.com')
    pg.post('/client/v11/databases/1/backups').reply(200, {
      num: 5,
      from_name: 'DATABASE',
      uuid: '100-001',
    })
    pg.get('/client/v11/apps/mybillingapp/transfers/100-001?verbose=true').reply(200, {
      finished_at: '101',
      succeeded: true,
      logs: [{created_at: '100', message: 'log message 1'}],
    })

    let dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    pg.get('/client/v11/databases/1').reply(200, dbA)

    cli.mockConsole()

    return cmdRun({app: 'myapp', args: {}, flags: {verbose: true}})
      .then(() => expect(cli.stdout).to.equal(`
Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
Use heroku pg:backups:info to check progress.
Stop a running backup with heroku pg:backups:cancel.

HINT: You are running this command with a non-billing application.
Use heroku pg:backups -a mybillingapp to check the list of backups.

Backing up DATABASE to b005...
100 log message 1
`))
    // eslint-disable-next-line prefer-regex-literals
      .then(() => expect(cli.stderr, 'to match', new RegExp(`Starting backup of postgres-1... done
`))).then(() => expect(cli.stderr, 'to match', new RegExp('backups of large databases are likely to fail'))) // eslint-disable-line prefer-regex-literals
  })

  it('captures a snapshot if called with the --snapshot flag', () => {
    addon.app.name = 'mybillingapp'
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon}])

    pg = nock('https://api.data.heroku.com')
    pg.post('/postgres/v0/databases/1/snapshots').reply(200, {})

    cli.mockConsole()

    return cmdRun({app: 'myapp', args: {}, flags: {snapshot: true}})
      .then(() => expect(cli.stderr).to.equal(`Taking snapshot of postgres-1... done
`))
  })
}

describe('pg:backups:capture', () => {
  shouldCapture(args => cmd.run(args))
})

describe('pg:backups capture', () => {
  shouldCapture(require('./helpers.js').dup('capture', cmd))
})
