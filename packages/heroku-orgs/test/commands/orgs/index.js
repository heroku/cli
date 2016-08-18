'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/orgs')
let stubGet = require('../../stub/get')

describe('heroku orgs', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows the orgs', () => {
    let apiGetOrgs = stubGet.orgs()

    return cmd.run({flags: {}})
      .then(() => expect(
        `org a         collaborator
org b         admin
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgs.done())
  })
})
