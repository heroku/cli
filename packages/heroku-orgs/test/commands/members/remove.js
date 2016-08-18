'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/members/remove')
let stubDelete = require('../../stub/delete')

describe('heroku members:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('removes a member from an org', () => {
    let apiRemoveMemberFromOrg = stubDelete.memberFromOrg()
    return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Removing foo@foo.com from myorg... done
`).to.eq(cli.stderr))
      .then(() => apiRemoveMemberFromOrg.done())
  })
})
