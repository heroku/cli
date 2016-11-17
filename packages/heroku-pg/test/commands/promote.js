'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {
  name: 'postgres-1'
}
const fetcher = () => {
  return {
    addon: () => addon
  }
}

const cmd = proxyquire('../../commands/promote', {
  '../lib/fetcher': fetcher
})

describe('pg:promote', () => {
  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('promotes db', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}}
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      confirm: 'myapp'
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })
})
