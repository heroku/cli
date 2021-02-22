'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/teams')
let stubGet = require('../../stub/get')

describe('heroku teams', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows the teams you are a member of', async () => {
    let apiGetOrgs = stubGet.teams()

    await cmd.run({ flags: {} })

    expect(
        `enterprise a  collaborator
enterprise b  admin
team a        collaborator
team b        admin
`).to.eq(cli.stdout);

    expect('').to.eq(cli.stderr);

    return apiGetOrgs.done()
  })
})
