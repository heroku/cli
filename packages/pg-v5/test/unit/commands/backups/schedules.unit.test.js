'use strict'
/* global beforeEach afterEach context */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:schedules')

const shouldSchedules = function (cmdRun) {
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('shows empty message with no databases', () => {
    api.get('/apps/myapp/addons').reply(200, [])
    return expect(cmdRun({app: 'myapp'})).to.be.rejectedWith('No heroku-postgresql databases on myapp')
  })

  context('with databases', () => {
    beforeEach(() => {
      api.get('/apps/myapp/addons').reply(200, [
        {
          id: 1,
          name: 'postgres-1',
          plan: {name: 'heroku-postgresql:standard-0'},
          app: {name: 'myapp'},
        },
      ])
    })

    it('shows empty message with no schedules', () => {
      pg.get('/client/v11/databases/1/transfer-schedules').reply(200, [])
      return cmd.run({app: 'myapp'}).then(() => {
        expect(cli.stderr).to.contain('No backup schedules found on myapp\n')

        expect(cli.stderr).to.contain('Use heroku pg:backups:schedule to set one up\n')
      })
    })

    it('shows schedule', () => {
      pg.get('/client/v11/databases/1/transfer-schedules').reply(200, [
        {name: 'DATABASE_URL', hour: 5, timezone: 'UTC'},
      ])
      return cmdRun({app: 'myapp'}).then(() =>
        expect(cli.stdout).to.equal(
          `=== Backup Schedules
DATABASE_URL: daily at 5:00 UTC
`,
        ),
      )
    })
  })
}

describe('pg:backups:schedules', () => {
  shouldSchedules(args => cmd.run(args))
})

describe('pg:backups schedules', () => {
  shouldSchedules(require('./helpers.js').dup('schedules', cmd))
})
