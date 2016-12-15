'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')

const addon = {name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}}

const cmd = require('../../../commands/backups/capture')

const shouldCapture = function (cmdRun) {
  let pg
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'DATABASE_URL'}).reply(200, [{addon}])

    pg = nock('https://postgres-api.heroku.com')
    pg.post('/client/v11/databases/postgres-1/backups').reply(200, {
      num: 5,
      from_name: 'DATABASE',
      uuid: '100-001'
    })
    pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {
      finished_at: '101',
      succeeded: true
    })
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  it('captures a db', () => {
    return cmdRun({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stdout, 'to equal', `
Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
Use heroku pg:backups:info to check progress.
Stop a running backup with heroku pg:backups:cancel.

`))
    .then(() => expect(cli.stderr, 'to equal', `Starting backup of postgres-1... done
Backing up DATABASE to b005... pending
Backing up DATABASE to b005... done
`))
  })
}

describe('pg:backups:capture', () => {
  shouldCapture((args) => cmd.run(args))
})

describe('pg:backups capture', () => {
  shouldCapture(require('./helpers.js').dup('capture', cmd))
})
