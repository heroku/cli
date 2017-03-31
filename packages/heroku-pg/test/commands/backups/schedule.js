'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:schedule')

const shouldSchedule = function (cmdRun) {
  let pg, api

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'DATABASE_URL'}).reply(200, [
      {
        addon: {
          id: 1,
          name: 'postgres-1',
          plan: {name: 'heroku-postgresql:standard-0'}
        },
        config_vars: [
          'DATABASE_URL'
        ]
      }
    ])
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('schedules a backup', () => {
    pg.post('/client/v11/databases/1/transfer-schedules', {
      'hour': '06', 'timezone': 'America/New_York', 'schedule_name': 'DATABASE_URL'
    }).reply(201)
    return cmdRun({app: 'myapp', args: {}, flags: {at: '06:00 EDT'}})
    .then(() => expect(cli.stdout, 'to equal', ''))
    .then(() => expect(cli.stderr, 'to equal', 'Scheduling automatic daily backups of postgres-1 at 06:00 America/New_York... done\n'))
  })
}

describe('pg:backups:schedule', () => {
  shouldSchedule((args) => cmd.run(args))
})

describe('pg:backups schedule', () => {
  shouldSchedule(require('./helpers.js').dup('schedule', cmd))
})
