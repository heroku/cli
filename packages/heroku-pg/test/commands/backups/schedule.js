'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:schedule')

describe('pg:backups:schedule', () => {
  let pg, api

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'DATABASE_URL'}).reply(200, [{
      addon: {
        name: 'postgres-1',
        plan: {name: 'heroku-postgresql:standard-0'}
      }
    }])
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('schedules a backup', () => {
    pg.post('/client/v11/databases/postgres-1/transfer-schedules').reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {at: '06:00 EDT'}})
    .then(() => expect(cli.stdout, 'to equal', ''))
    .then(() => expect(cli.stderr, 'to equal', 'Scheduling automatic daily backups of postgres-1 at 06:00 America/New_York... done\n'))
  })
})
