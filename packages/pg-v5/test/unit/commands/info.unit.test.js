'use strict'
/* global beforeEach afterEach context */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const unwrap = require('../../unwrap')

let all = []
let addon
const fetcher = () => {
  return {
    all: () => all,
    addon: () => addon,
  }
}

const cmd = proxyquire('../../../commands/info', {
  '../lib/fetcher': fetcher,
})[0]

describe('pg', () => {
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    pg = nock('https://postgres-starter-api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  context('with 0 dbs', () => {
    it('shows empty state', () => {
      all = []
      api.get('/apps/myapp/config-vars').reply(200, {})

      return cmd.run({app: 'myapp', args: {}})
        .then(() => expect(cli.stdout).to.equal('myapp has no heroku-postgresql databases.\n'))
        .then(() => expect(cli.stderr).to.equal(''))
    })
  })

  context('with 2 dbs', () => {
    let plan = {name: 'heroku-postresql:hobby-dev'}
    let config = {
      DATABASE_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx',
      HEROKU_POSTGRESQL_COBALT_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx',
      HEROKU_POSTGRESQL_PURPLE_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec3-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx',
    }
    let addons = [
      {id: 1, name: 'postgres-1', plan, app: {name: 'myapp2'}},
      {id: 2, name: 'postgres-2', plan, app: {name: 'myapp'}},
    ]
    let dbA = {info: [
      {name: 'Plan', values: ['Hobby-dev']},
      {name: 'Empty', values: []},
      {name: 'Following', resolve_db_name: true, values: ['postgres://ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx']},
    ],
    resource_url: config.DATABASE_URL,
    }
    let dbB = {info: [
      {name: 'Plan', values: ['Hobby-dev']},
      {name: 'Following', resolve_db_name: true, values: ['postgres://ec2-55-111-111-1.compute-1.amazonaws.com/dxxxxxxxxxxxx']},
    ],
    resource_url: config.HEROKU_POSTGRESQL_PURPLE_URL,
    }

    it('shows postgres info', () => {
      all = addons

      api.get('/apps/myapp/config-vars').reply(200, config)
      pg
        .get('/client/v11/databases/1').reply(200, dbA)
        .get('/client/v11/databases/2').reply(200, dbB)

      return cmd.run({app: 'myapp', args: {}})
        .then(() => expect(cli.stdout).to.equal(`=== DATABASE_URL, HEROKU_POSTGRESQL_COBALT_URL
Plan:        Hobby-dev
Following:   HEROKU_POSTGRESQL_COBALT
Billing App: myapp2
Add-on:      postgres-1

=== HEROKU_POSTGRESQL_PURPLE_URL
Plan:      Hobby-dev
Following: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx
Add-on:    postgres-2

`))
        .then(() => expect(cli.stderr).to.equal(''))
    })

    it('shows postgres info using attachment names', () => {
      all = [
        {id: 1, name: 'postgres-1', plan, app: {name: 'myapp2'}, attachment_names: ['DATABASE', 'ATTACHMENT_NAME']},
        {id: 2, name: 'postgres-2', plan, app: {name: 'myapp'}, attachment_names: ['HEROKU_POSTGRESQL_PURPLE']},
      ]

      api.get('/apps/myapp/config-vars').reply(200, config)
      pg
        .get('/client/v11/databases/1').reply(200, dbA)
        .get('/client/v11/databases/2').reply(200, dbB)

      return cmd.run({app: 'myapp', args: {}})
        .then(() => expect(cli.stdout).to.equal(`=== DATABASE_URL, ATTACHMENT_NAME_URL
Plan:        Hobby-dev
Following:   HEROKU_POSTGRESQL_COBALT
Billing App: myapp2
Add-on:      postgres-1

=== HEROKU_POSTGRESQL_PURPLE_URL
Plan:      Hobby-dev
Following: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx
Add-on:    postgres-2

`))
    })

    it('shows postgres info for single database when arg sent in', () => {
      addon = addons[1]
      api.get('/apps/myapp/config-vars').reply(200, config)

      pg
        .get('/client/v11/databases/2')
        .reply(200, dbB)
      return cmd.run({app: 'myapp', args: {database: 'postgres-2'}})
        .then(() => expect(cli.stdout).to.equal(`=== HEROKU_POSTGRESQL_PURPLE_URL
Plan:      Hobby-dev
Following: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx
Add-on:    postgres-2

`))
        .then(() => expect(cli.stderr).to.equal(''))
    })

    it('shows warning for 404', () => {
      all = addons

      api.get('/apps/myapp/config-vars').reply(200, config)
      pg
        .get('/client/v11/databases/1').reply(404)
        .get('/client/v11/databases/2').reply(200, dbB)

      return cmd.run({app: 'myapp', args: {}})
        .then(() => expect(cli.stdout).to.equal(`=== HEROKU_POSTGRESQL_PURPLE_URL
Plan:      Hobby-dev
Following: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx
Add-on:    postgres-2

`))
        .then(() => expect(unwrap(cli.stderr)).to.equal(`postgres-1 is not yet provisioned. \
Run heroku addons:wait to wait until the db is provisioned.
`))
    })
  })
})
