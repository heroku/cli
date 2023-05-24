'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:schedule')

const shouldSchedule = function (cmdRun) {
  let pg
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [
      {
        addon: {
          id: 1,
          name: 'postgres-1',
          plan: {name: 'heroku-postgresql:standard-0'},
        },
        config_vars: [
          'DATABASE_URL',
        ],
        name: 'DATABASE',
      },
    ])
    pg = nock('https://postgres-api.heroku.com')
    pg.post('/client/v11/databases/1/transfer-schedules', {
      hour: '06', timezone: 'America/New_York', schedule_name: 'DATABASE_URL',
    }).reply(201)

    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('schedules a backup', () => {
    let dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    pg.get('/client/v11/databases/1').reply(200, dbA)
    return cmdRun({app: 'myapp', args: {}, flags: {at: '06:00 EDT', confirm: 'myapp'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr, 'to match', /Scheduling automatic daily backups of postgres-1 at 06:00 America\/New_York... done\n/))
  })

  it('warns user that logical backups are error prone if continuous proctecion is on', () => {
    let dbA = {info: [
      {name: 'Continuous Protection', values: ['On']},
    ]}
    pg.get('/client/v11/databases/1').reply(200, dbA)

    return cmdRun({app: 'myapp', args: {}, flags: {at: '06:00 EDT'}})
      .then(() => expect(cli.stderr, 'to match', /backups of large databases are likely to fail/))
  })

  it('does not warn user that logical backups are error prone if continuous proctecion is off', () => {
    let dbA = {info: [
      {name: 'Continuous Protection', values: ['Off']},
    ]}
    pg.get('/client/v11/databases/1').reply(200, dbA)

    return cmdRun({app: 'myapp', args: {}, flags: {at: '06:00 EDT'}})
      .then(() => expect(cli.stderr, 'not to match', /backups of large databases are likely to fail/))
  })
}

describe('pg:backups:schedule', () => {
  shouldSchedule(args => cmd.run(args))
})

describe('pg:backups schedule', () => {
  shouldSchedule(require('./helpers.js').dup('schedule', cmd))
})
