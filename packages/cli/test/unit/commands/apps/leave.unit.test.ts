import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/apps/leave'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from '@oclif/test'

function mockUserAccount(email = 'raulb@heroku.com') {
  return nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, {email})
}

function mockCollaboratorsPersonalApp(app: string, email: string) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${encodeURIComponent(email)}`)
    .reply(200, {})
}

function mockCollaboratorsPersonalAppDeleteFailure(app: string, email: string) {
  return nock('https://api.heroku.com:443', {})
    .delete(`/apps/${app}/collaborators/${encodeURIComponent(email)}`).reply(404, {})
}

describe('heroku apps:leave', function () {
  let apiGetUserAccount: ReturnType<typeof mockUserAccount>
  let apiDeletePersonalAppCollaborator: ReturnType<typeof mockCollaboratorsPersonalApp>

  beforeEach(function () {
    apiGetUserAccount = mockUserAccount()
    apiDeletePersonalAppCollaborator = mockCollaboratorsPersonalApp('myapp', 'raulb@heroku.com')
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  context('when it is an org app', function () {
    it('leaves the app', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Leaving myapp...\nLeaving myapp... done\n')
      apiGetUserAccount.done()
      apiDeletePersonalAppCollaborator.done()
    })
  })

  context('when it is not an org app', function () {
    it('leaves the app', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.eq('Leaving myapp...\nLeaving myapp... done\n')
      apiGetUserAccount.done()
      apiDeletePersonalAppCollaborator.done()
    })
  })

  describe('when the user tries to leave the app', function () {
    before(function () {
      apiGetUserAccount = mockUserAccount()
      apiDeletePersonalAppCollaborator = mockCollaboratorsPersonalAppDeleteFailure('myapp', 'raulb@heroku.com')
    })

    after(function () {
      return nock.cleanAll()
    })

    it('shows an error if the heroku.delete() operation returns an error', async function () {
      try {
        await runCommand(Cmd, [
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
