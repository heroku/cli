'use strict'
/* global describe it beforeEach afterEach context */

let expect = require('unexpected')
let nock = require('nock')
let cmd = require('../../index.js').commands.find((c) => c.topic === 'pg' && !c.command)
let cli = require('heroku-cli-util')

describe('pg', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  context('with 0 dbs', () => {
    let config = {}
    let addons = []

    it('shows empty state', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, config)
      .get('/apps/myapp/addons')
      .reply(200, addons)
      return cmd.run({app: 'myapp'})
      .then(() => expect(cli.stdout, 'to equal', 'myapp has no heroku-postgresql databases.\n'))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => api.done())
    })
  })

  context('with 2 dbs', () => {
    let plan = {name: 'heroku-postresql:hobby-dev'}
    let config = {HEROKU_POSTGRESQL_COBALT_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx'}
    let addon_service = {name: 'heroku-postgresql'}
    let addons = [
      {name: 'postgres-1', addon_service, plan, config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_PINK_URL']},
      {name: 'postgres-2', addon_service, plan, config_vars: ['HEROKU_POSTGRESQL_BRONZE_URL']}
    ]
    let dbA = {info: [
      {name: 'Plan', values: ['Hobby-dev']},
      {name: 'Empty', values: []},
      {name: 'Following', resolve_db_name: true, values: ['postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx']}
    ]}
    let dbB = {info: [
      {name: 'Plan', values: ['Hobby-dev']},
      {name: 'Following', resolve_db_name: true, values: ['postgres://uxxxxxxxxx:pxxxxxxxx@ec2-55-111-111-1.compute-1.amazonaws.com/dxxxxxxxxxxxx']}
    ]}

    it('shows postgres info', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, config)
      .get('/apps/myapp/addons')
      .reply(200, addons)
      let pg = nock('https://postgres-starter-api.heroku.com:443')
      .get('/client/v11/databases/postgres-1')
      .reply(200, dbA)
      .get('/client/v11/databases/postgres-2')
      .reply(200, dbB)
      return cmd.run({app: 'myapp'})
      .then(() => expect(cli.stdout, 'to equal', `=== postgres-1
Config Vars: DATABASE_URL, HEROKU_POSTGRESQL_PINK_URL
Plan:        Hobby-dev
Following:   HEROKU_POSTGRESQL_COBALT

=== postgres-2
Config Vars: HEROKU_POSTGRESQL_BRONZE_URL
Plan:        Hobby-dev
Following:   ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx

`))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => api.done())
      .then(() => pg.done())
    })
  })
})
