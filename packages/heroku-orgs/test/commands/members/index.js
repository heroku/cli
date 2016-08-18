'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/members')
let stubGet = require('../../stub/get')

describe('heroku members', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  let apiGetOrgMembers

  it('shows there are not org members if it is an orphan org', () => {
    apiGetOrgMembers = stubGet.orgMembers([])
    return cmd.run({org: 'myorg', flags: {}})
      .then(() => expect(
        `No members in myorg
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgMembers.done())
  })

  it('shows all the org members', () => {
    apiGetOrgMembers = stubGet.orgMembers([
      {email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'collaborator'}
    ])
    return cmd.run({org: 'myorg', flags: {}})
      .then(() => expect(
        `a@heroku.com  admin
b@heroku.com  collaborator
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgMembers.done())
  })

  let expectedOrgMembers = [{email: 'a@heroku.com', role: 'admin'}, {email: 'b@heroku.com', role: 'member'}]

  it('filters members by role', () => {
    apiGetOrgMembers = stubGet.orgMembers(expectedOrgMembers)
    return cmd.run({org: 'myorg', flags: {role: 'member'}})
      .then(() => expect(
        `b@heroku.com  member
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgMembers.done())
  })

  it("shows the right message when filter doesn't return results", () => {
    apiGetOrgMembers = stubGet.orgMembers(expectedOrgMembers)
    return cmd.run({org: 'myorg', flags: {role: 'collaborator'}})
      .then(() => expect(
        `No members in myorg with role collaborator
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgMembers.done())
  })

  it('filters members by role', () => {
    apiGetOrgMembers = stubGet.orgMembers(expectedOrgMembers)
    return cmd.run({org: 'myorg', flags: {role: 'member'}})
      .then(() => expect(
        `b@heroku.com  member
`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgMembers.done())
  })
})
