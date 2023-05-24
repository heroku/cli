'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:unschedule')

const addon = {
  id: 1,
  name: 'postgres-1',
  app: {name: 'myapp'},
  plan: {name: 'heroku-postgresql:standard-0'},
}

const attachment = {addon}

const shouldUnschedule = function (cmdRun) {
  let pg
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    api.get('/apps/myapp/addons').reply(200, [addon])
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [attachment])
    pg = nock('https://postgres-api.heroku.com')
    pg.get('/client/v11/databases/1/transfer-schedules').twice().reply(200, [{name: 'DATABASE_URL', uuid: '100-001'}])
    pg.delete('/client/v11/databases/1/transfer-schedules/100-001').reply(200)
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('unschedules a backup', () => {
    return cmdRun({app: 'myapp', args: {}, flags: {at: '06:00 EDT'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Unscheduling DATABASE_URL daily backups... done\n'))
  })
}

describe('pg:backups:unschedule', () => {
  shouldUnschedule(args => cmd.run(args))
})

describe('pg:backups unschedule', () => {
  shouldUnschedule(require('./helpers.js').dup('unschedule', cmd))
})
