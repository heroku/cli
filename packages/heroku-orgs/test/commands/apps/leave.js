'use strict'
/* globals describe it beforeEach afterEach cli nock context expect */

let cmd = require('../../../commands/apps/leave').apps
let stubGet = require('../../stub/get')
let stubDelete = require('../../stub/delete')

describe('heroku apps:leave', () => {
  let apiGetUserAccount
  let apiDeletePersonalAppCollaborator

  beforeEach(() => {
    apiGetUserAccount = stubGet.userAccount()
    apiDeletePersonalAppCollaborator = stubDelete.collaboratorsPersonalApp('myapp', 'raulb%40heroku.com')
    cli.mockConsole()
  })
  afterEach(() => nock.cleanAll())

  context('when it is an org app', () => {
    it('leaves the app', () => {
      return cmd.run({app: 'myapp'})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Leaving myapp... done
`).to.eq(cli.stderr))
        .then(() => apiGetUserAccount.done())
        .then(() => apiDeletePersonalAppCollaborator.done())
    })
  })

  context('when it is not an org app', () => {
    it('leaves the app', () => {
      return cmd.run({app: 'myapp'})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Leaving myapp... done
`).to.eq(cli.stderr))
        .then(() => apiGetUserAccount.done())
        .then(() => apiDeletePersonalAppCollaborator.done())
    })
  })
})
