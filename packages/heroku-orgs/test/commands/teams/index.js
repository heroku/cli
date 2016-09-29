'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/teams')
let stubGet = require('../../stub/get')

describe('heroku teams', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows only the Heroku Teams', () => {
    let apiGetOrgs = stubGet.orgs()

    return cmd.run({flags: {}})
      .then(() => expect(
        `team a  collaborator
team b  admin
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgs.done())
  })
})
