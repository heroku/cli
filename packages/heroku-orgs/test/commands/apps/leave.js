'use strict'
/* globals describe it beforeEach afterEach cli nock context expect */

let cmd = require('../../../commands/apps/leave').apps
let stubGet = require('../../stub/get')
let stubDelete = require('../../stub/delete')

describe('heroku apps:leave', () => {
  let apiGetUserAccount

  beforeEach(() => {
    apiGetUserAccount = stubGet.userAccount()
    cli.mockConsole()
  })
  afterEach(() => nock.cleanAll())

  context('when it is an org app', () => {
    let apiDeleteOrgAppCollaborator
    let apiOrgApp

    beforeEach(() => {
      apiDeleteOrgAppCollaborator = stubDelete.collaboratorsOrgApp('myapp', 'raulb%40heroku.com')
      apiOrgApp = stubGet.orgApp()
    })

    it('leaves the app', () => {
      return cmd.run({app: 'myapp'})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Leaving myapp... done
`).to.eq(cli.stderr))
        .then(() => apiOrgApp.done())
        .then(() => apiGetUserAccount.done())
        .then(() => apiDeleteOrgAppCollaborator.done())
    })
  })

  context('when it is not an org app', () => {
    let apiDeletePersonalAppCollaborator
    let apiGetPersonalApp

    beforeEach(() => {
      apiDeletePersonalAppCollaborator = stubDelete.collaboratorsPersonalApp('myapp', 'raulb%40heroku.com')
      apiGetPersonalApp = stubGet.personalApp()
    })

    it('leaves the app', () => {
      return cmd.run({app: 'myapp'})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Leaving myapp... done
`).to.eq(cli.stderr))
        .then(() => apiGetPersonalApp.done())
        .then(() => apiGetUserAccount.done())
        .then(() => apiDeletePersonalAppCollaborator.done())
    })
  })
})
