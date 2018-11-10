'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/apps/join')[0]
let stubPost = require('../../stub/post')
let stubGet = require('../../stub/get')

describe('heroku apps:join', () => {
  let apiGetUserAccount
  let apiPostCollaborators

  beforeEach(() => {
    cli.mockConsole()
    apiGetUserAccount = stubGet.userAccount('raulb@heroku.com')
  })
  afterEach(() => nock.cleanAll())

  it('joins the app', () => {
    apiPostCollaborators = stubPost.orgAppcollaborators('raulb@heroku.com')

    return cmd.run({ app: 'myapp' })
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Joining myapp... done
`).to.eq(cli.stderr))
      .then(() => apiGetUserAccount.done())
      .then(() => apiPostCollaborators.done())
  })

  it('is forbidden from joining the app', () => {
    let response = {
      code: 403,
      description: { id: 'forbidden', error: 'You do not have access to the organization heroku-tools.' }
    }

    apiPostCollaborators = stubPost.orgAppcollaborators('raulb@heroku.com', [], response)
    let thrown = false

    return cmd.run({ app: 'myapp' })
      .then(() => apiGetUserAccount.done())
      .catch(function (err) {
        thrown = true
        expect(err.body.error).to.eq('You do not have access to the organization heroku-tools.')
      })
      .then(function () {
        expect(thrown).to.eq(true)
      })
      .then(() => apiPostCollaborators.done())
  })
})
