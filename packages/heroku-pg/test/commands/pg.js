'use strict'
/* global describe it beforeEach afterEach */

let expect = require('unexpected')
let nock = require('nock')
let cmd = require('../../index.js').commands.find((c) => c.topic === 'pg' && !c.command)
let cli = require('heroku-cli-util')

describe('pg', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  let addon_service = {name: 'heroku-postgresql'}

  describe('hobby-dev', () => {
    let plan = {name: 'heroku-postresql:hobby-dev'}
    let config = {}

    it('shows postgres info', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, config)
      .get('/apps/myapp/addons')
      .reply(200, [{name: 'postgres-1', addon_service, plan, config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_PINK_URL']}])
      let pg = nock('https://postgres-starter-api.heroku.com:443')
      .get('/client/v11/databases/postgres-1')
      .reply(200, {info: [{name: 'Plan', values: ['Hobby-dev']}]})
      return cmd.run({app: 'myapp'})
      .then(() => expect(cli.stdout, 'to equal', `=== postgres-1
Config Vars: DATABASE_URL, HEROKU_POSTGRESQL_PINK_URL
Plan:        Hobby-dev\n\n`))
      .then(() => expect(cli.stderr, 'to equal', ''))
      .then(() => api.done())
      .then(() => pg.done())
    })
  })
})
