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

  it('joins the app', async () => {
    apiPostCollaborators = stubPost.teamAppCollaborators('raulb@heroku.com')

    await cmd.run({ app: 'myapp' })

    expect('').to.eq(cli.stdout);

    expect(`Joining myapp... done
`).to.eq(cli.stderr);

    apiGetUserAccount.done();

    return apiPostCollaborators.done()
  })

  it('is forbidden from joining the app', async () => {
    let response = {
      code: 403,
      description: { id: 'forbidden', error: 'You do not have access to the team heroku-tools.' }
    }

    apiPostCollaborators = stubPost.teamAppCollaborators('raulb@heroku.com', [], response)
    let thrown = false

    await cmd.run({ app: 'myapp' })
      .catch(function (err) {
        thrown = true
        expect(err.body.error).to.eq('You do not have access to the team heroku-tools.')
      })

    apiGetUserAccount.done();
    expect(thrown).to.eq(true)

    return apiPostCollaborators.done()
  })
})
