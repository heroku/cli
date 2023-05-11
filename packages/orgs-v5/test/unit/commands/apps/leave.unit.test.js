'use strict'
/* globals after before beforeEach afterEach cli nock context expect */

let cmd = require('../../../../commands/apps/leave')[0]
let stubGet = require('../../stub/get')
let stubDelete = require('../../stub/delete')
let stubDeleteError = require('../../stub/delete')

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

  describe('when the user tries to leave the app', () => {
    before(() => {
      apiGetUserAccount = stubGet.userAccount()
      apiDeletePersonalAppCollaborator = stubDeleteError.collaboratorsPersonalAppDeleteFailure('myapp', 'raulb%40heroku.com')
      cli.mockConsole()
    })
    after(() => nock.cleanAll())

    it('shows an error if the heroku.delete() operation returns an error', () => {
      return cmd.run({app: 'myapp'})
        .then(() => apiGetUserAccount.done())
        .then(() => apiDeletePersonalAppCollaborator.done())
        .catch(function (error) {
          expect(error).to.be.an.instanceof(Error)
        })
    })
  })
})
