'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/orgs')

describe('heroku orgs', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows the orgs', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/organizations')
      .reply(200, [
        {name: 'org a', role: 'collaborator'},
        {name: 'org b', role: 'admin'}
      ])
    return cmd.run({flags: {}})
      .then(() => expect(
        `org a         collaborator
org b         admin
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => api.done())
  })
})
