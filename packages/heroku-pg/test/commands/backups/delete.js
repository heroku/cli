'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:delete')

describe('pg:backups:delete', () => {
  let pg

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    pg.delete('/client/v11/apps/myapp/transfers/3').reply(200, {
      url: 'https://dburl'
    })
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  it('shows URL', () => {
    return cmd.run({app: 'myapp', args: {backup_id: 'b003'}, flags: {confirm: 'myapp'}})
    .then(() => expect(cli.stderr, 'to equal', 'Deleting backup b003 on myapp... done\n'))
  })
})
