'use strict'
/* globals beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/teams')
let stubGet = require('../../stub/get')

describe('heroku teams', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows the teams you are a member of', () => {
    let apiGetOrgs = stubGet.teams()

    return cmd.run({flags: {}})
      .then(() => expect(
        `enterprise a  collaborator
enterprise b  admin
team a        collaborator
team b        admin
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgs.done())
  })
})
