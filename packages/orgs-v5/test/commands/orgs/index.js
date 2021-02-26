'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/orgs')
let stubGet = require('../../stub/get')

describe('heroku teams', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows Enterprise teams only when passing the --enterprise flag', async () => {
    let apiGetTeams = stubGet.teams()

    await cmd.run({ flags: { enterprise: true } })

    expect(
        `enterprise a  collaborator
enterprise b  admin\n`).to.eq(cli.stdout);

    expect('').to.eq(cli.stderr);

    return apiGetTeams.done()
  })

  it('shows teams', async () => {
    let apiGetTeamsOnly = stubGet.teams([
      { name: 'enterprise a', role: 'collaborator', type: 'enterprise' },
      { name: 'enterprise b', role: 'admin', type: 'enterprise' }
    ])

    await cmd.run({ flags: {} })

    expect(
        `enterprise a  collaborator
enterprise b  admin\n`).to.eq(cli.stdout);

    expect('').to.eq(cli.stderr);

    return apiGetTeamsOnly.done()
  })
})
