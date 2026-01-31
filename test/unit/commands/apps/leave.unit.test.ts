import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import LeaveCommand from '../../../../src/commands/apps/leave.js'
import runCommandHelper from '../../../helpers/runCommand.js'

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
      await runCommandHelper(LeaveCommand, [
        '--app',
        'myapp',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Leaving ⬢ myapp... done\n')
      apiGetUserAccount.done()
      apiDeletePersonalAppCollaborator.done()
    })
  })

  context('when it is not an org app', function () {
    it('leaves the app', async function () {
      await runCommandHelper(LeaveCommand, [
        '--app',
        'myapp',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Leaving ⬢ myapp... done\n')
      apiGetUserAccount.done()
      apiDeletePersonalAppCollaborator.done()
    })
  })

  describe('when the user tries to leave the app', function () {
    it('shows an error if the heroku.delete() operation returns an error', async function () {
      try {
        await runCommandHelper(LeaveCommand, [
          '--app',
          'myapp',
        ])
        apiGetUserAccount.done()
        apiDeletePersonalAppCollaborator.done()
      } catch (error) {
        expect(error).to.be.an.instanceof(Error)
      }
    })
  })
})
