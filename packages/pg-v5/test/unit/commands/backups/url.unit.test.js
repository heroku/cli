'use strict'
/* global beforeEach afterEach context */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const cmd = require('../../../..').commands.find(c => c.topic === 'pg' && c.command === 'backups:url')

const shouldUrl = function (cmdRun) {
  let pg

  beforeEach(() => {
    pg = nock('https://api.data.heroku.com')
    pg.post('/client/v11/apps/myapp/transfers/3/actions/public-url').reply(200, {
      url: 'https://dburl',
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
        {succeeded: true, to_type: 'gof3r', num: 3},
      ])
    })
    it('shows URL', () => {
      return cmdRun({app: 'myapp', args: {}})
        .then(() => expect(cli.stdout).to.equal('https://dburl\n'))
    })
  })

  context('with id', () => {
    it('shows URL', () => {
      return cmdRun({app: 'myapp', args: {backup_id: 'b003'}})
        .then(() => expect(cli.stdout).to.equal('https://dburl\n'))
    })
  })
}

describe('pg:backups:url', () => {
  shouldUrl(args => cmd.run(args))
})

describe('pg:backups url', () => {
  shouldUrl(require('./helpers.js').dup('url', cmd))
})
