'use strict'
/* global describe it beforeEach afterEach context */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')

const cmd = require('../..').commands.find(c => c.topic === 'pg' && c.command === 'copy')

const addon = {
  name: 'postgres-1',
  app: {name: 'myapp'},
  config_vars: ['DATABASE_URL'],
  plan: {name: 'heroku-postgresql:standard-0'}
}
const attachment = {
  name: 'HEROKU_POSTGRESQL_RED_URL',
  addon
}

describe('pg:copy', () => {
  let pg, api

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    api = nock('https://api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  context('url to heroku', () => {
    beforeEach(() => {
      api.get('/addons/postgres-1').reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'DATABASE_URL'}).reply(200, [attachment])
      api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://heroku/db'})
      pg.post('/client/v11/databases/postgres-1/transfers', {
        from_name: 'database bar on foo.com:5432',
        from_url: 'postgres://foo.com/bar',
        to_name: 'RED',
        to_url: 'postgres://heroku/db'
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: true})
    })

    it('copies', () => {
      return cmd.run({app: 'myapp', args: {source: 'postgres://foo.com/bar', target: 'DATABASE_URL'}, flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout, 'to equal', ''))
      .then(() => expect(cli.stderr, 'to equal', `Starting copy of database bar on foo.com:5432 to RED... done
Copying... pending
Copying... done
`))
    })
  })

  context('fails', () => {
    beforeEach(() => {
      api.get('/addons/postgres-1').reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {app: 'myapp', addon_attachment: 'DATABASE_URL'}).reply(200, [attachment])
      api.get('/apps/myapp/config-vars').reply(200, {DATABASE_URL: 'postgres://heroku/db'})
      pg.post('/client/v11/databases/postgres-1/transfers', {
        from_name: 'database bar on foo.com:5432',
        from_url: 'postgres://foo.com/bar',
        to_name: 'RED',
        to_url: 'postgres://heroku/db'
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: false, num: 1})
      pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true').reply(200, {finished_at: '100', succeeded: false, num: 1, logs: [{message: 'foobar'}]})
    })

    it('fails to copy', () => {
      let err = 'An error occurred and the backup did not finish.\n\nfoobar\n\nRun heroku pg:backups:info b001 for more details.'
      return expect(cmd.run({app: 'myapp', args: {source: 'postgres://foo.com/bar', target: 'DATABASE_URL'}, flags: {confirm: 'myapp'}}), 'to be rejected with', err)
      .then(() => expect(cli.stdout, 'to equal', ''))
      .then(() => expect(cli.stderr, 'to equal', `Starting copy of database bar on foo.com:5432 to RED... done
Copying... pending
Copying... !
`))
    })
  })
})
