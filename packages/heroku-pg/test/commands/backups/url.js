'use strict'
/* global describe it beforeEach afterEach context */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:url')

describe('pg:backups:url', () => {
  let pg

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    pg.post('/client/v11/apps/myapp/transfers/3/actions/public-url').reply(200, {
      url: 'https://dburl'
    })
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  context('with no id', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {succeeded: true, to_type: 'gof3r', num: 3}
      ])
    })
    it('shows URL', () => {
      return cmd.run({app: 'myapp', args: {}})
      .then(() => expect(cli.stdout, 'to equal', 'https://dburl\n'))
    })
  })

  context('with id', () => {
    it('shows URL', () => {
      return cmd.run({app: 'myapp', args: {backup_id: 'b003'}})
      .then(() => expect(cli.stdout, 'to equal', 'https://dburl\n'))
    })
  })
})
