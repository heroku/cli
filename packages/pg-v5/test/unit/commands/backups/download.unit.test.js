'use strict'
/* global beforeEach afterEach context */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:download')
const fs = require('fs')

describe('pg:backups:download', () => {
  let pg

  beforeEach(() => {
    pg = nock('https://api.data.heroku.com')
    pg.post('/client/v11/apps/myapp/transfers/3/actions/public-url').reply(200, {
      url: 'https://api.data.heroku.com/db',
    })
    pg.get('/db').reply(200, {})
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
  })

  context('with no id', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {succeeded: true, to_type: 'gof3r', num: 3},
      ])
    })
    it('downloads to latest.dump', () => {
      return cmd.run({app: 'myapp', args: {}, flags: {output: './tmp/latest.dump'}})
        .then(() => expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}'))
    })
  })

  context('with id', () => {
    it('downloads to latest.dump', () => {
      return cmd.run({app: 'myapp', args: {backup_id: 'b003'}, flags: {output: './tmp/latest.dump'}})
        .then(() => expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}'))
    })
  })
})
