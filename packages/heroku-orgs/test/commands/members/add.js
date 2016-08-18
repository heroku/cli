'use strict'
/* globals describe it beforeEach afterEach cli nock expect context */

let cmd = require('../../../commands/members/add').add
let stubGet = require('../../stub/get')
let stubPut = require('../../stub/put')


describe('heroku members:add', () => {
  let apiUpdateMemberRole

  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('adds a member to an org', () => {
    stubGet.variableSizeOrgMembers(1)
    stubGet.userFeatureFlags([])
    apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

    return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
      .then(() => apiUpdateMemberRole.done())
  })

  context('adding a member with the standard org creation flag', () => {
    beforeEach(() => {
      stubGet.userFeatureFlags([{name: 'standard-org-creation'}])
    })

    it('does not warn the user when under the free org limit', () => {
      stubGet.variableSizeOrgMembers(1)
      apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
        .then(() => apiUpdateMemberRole.done())
    })

    it('does not warn the user when over the free org limit', () => {
      stubGet.variableSizeOrgMembers(7)
      apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
        .then(() => apiUpdateMemberRole.done())
    })

    it('does warn the user when at the free org limit', () => {
      stubGet.variableSizeOrgMembers(6)
      apiUpdateMemberRole = stubPut.updateMemberRole('foo@foo.com', 'admin')

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
        .then(() => expect(`You'll be billed monthly for teams over 5 members.
`).to.eq(cli.stdout))
        .then(() => expect(`Adding foo@foo.com to myorg as admin... done
`).to.eq(cli.stderr))
        .then(() => apiUpdateMemberRole.done())
    })
  })
})
