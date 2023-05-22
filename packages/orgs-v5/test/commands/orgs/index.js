'use strict'
/* globals beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/orgs')
let stubGet = require('../../stub/get')

describe('heroku teams', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows Enterprise teams only when passing the --enterprise flag', () => {
    let apiGetTeams = stubGet.teams()

    return cmd.run({flags: {enterprise: true}})
      .then(() => expect(
        `enterprise a  collaborator
enterprise b  admin\n`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetTeams.done())
  })

  it('shows teams', () => {
    let apiGetTeamsOnly = stubGet.teams([
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
      {name: 'enterprise b', role: 'admin', type: 'enterprise'},
    ])

    return cmd.run({flags: {}})
      .then(() => expect(
        `enterprise a  collaborator
enterprise b  admin\n`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetTeamsOnly.done())
  })
})
