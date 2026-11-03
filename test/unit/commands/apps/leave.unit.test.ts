import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import LeaveCommand from '../../../../src/commands/apps/leave.js'

describe('heroku apps:leave', function () {
  let apiGetUserAccount: ReturnType<typeof mockUserAccount>
  let apiDeletePersonalAppCollaborator: ReturnType<typeof mockCollaboratorsPersonalApp>
  let api: nock.Scope

  function mockUserAccount(email = 'gandalf@heroku.com') {
    return api
      .get('/account')
      .reply(200, {email})
  }

  function mockCollaboratorsPersonalApp(app: string, email: string) {
    return api
      .delete(`/apps/${app}/collaborators/${encodeURIComponent(email)}`)
      .reply(200, {})
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    apiGetUserAccount = mockUserAccount()
    apiDeletePersonalAppCollaborator = mockCollaboratorsPersonalApp('myapp', 'gandalf@heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  context('when it is an org app', function () {
    it('leaves the app', async function () {
      const {stderr, stdout} = await runCommand(LeaveCommand, [
        '--app',
        'myapp',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Leaving ⬢ myapp... done\n')
      apiGetUserAccount.done()
      apiDeletePersonalAppCollaborator.done()
    })
  })

  context('when it is not an org app', function () {
    it('leaves the app', async function () {
      const {stderr, stdout} = await runCommand(LeaveCommand, [
        '--app',
        'myapp',
      ])
      expect('').to.eq(stdout)
      expect(stderr).to.eq('Leaving ⬢ myapp... done\n')
      apiGetUserAccount.done()
      apiDeletePersonalAppCollaborator.done()
    })
  })

  describe('when the user tries to leave the app', function () {
    it('shows an error if the heroku.delete() operation returns an error', async function () {
      nock.cleanAll()

      const account = nock('https://api.heroku.com')
        .get('/account')
        .reply(200, {email: 'gandalf@heroku.com'})
      const deletion = nock('https://api.heroku.com')
        .delete(`/apps/myapp/collaborators/${encodeURIComponent('gandalf@heroku.com')}`)
        .reply(403, {id: 'forbidden', message: 'You cannot leave this app.'})

      const {error} = await runCommand(LeaveCommand, [
        '--app',
        'myapp',
      ])
      expect(error).to.be.an.instanceof(Error)
      account.done()
      deletion.done()
    })
  })
})
