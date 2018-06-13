'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/orgs')
let stubGet = require('../../stub/get')

describe('heroku orgs', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows Enterprise orgs only when passing the --enterprise flag', () => {
    let apiGetOrgs = stubGet.orgs()

    return cmd.run({flags: { enterprise: true }})
      .then(() => expect(
        `org a          collaborator
org b          admin\n`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgs.done())
  })

  it('shows orgs (now called teams)', () => {
    let apiGetOrgsOnly = stubGet.orgs([
      {name: 'org a', role: 'collaborator', type: 'enterprise'},
      {name: 'org b', role: 'admin', type: 'enterprise'}
    ])

    return cmd.run({flags: {}})
      .then(() => expect(
        `org a          collaborator
org b          admin\n`).to.eq(cli.stdout))
      .then(() => expect('').to.eq(cli.stderr))
      .then(() => apiGetOrgsOnly.done())
  })
})
