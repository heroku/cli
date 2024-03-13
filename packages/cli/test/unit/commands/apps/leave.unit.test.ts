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

describe('heroku apps:leave', () => {
  let apiGetUserAccount: ReturnType<typeof mockUserAccount>
  let apiDeletePersonalAppCollaborator: ReturnType<typeof mockCollaboratorsPersonalApp>

  beforeEach(() => {
    apiGetUserAccount = mockUserAccount()
    apiDeletePersonalAppCollaborator = mockCollaboratorsPersonalApp('myapp', 'raulb@heroku.com')
  })

  afterEach(() => nock.cleanAll())

  context('when it is an org app', () => {
    it('leaves the app', async () => {
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

  context('when it is not an org app', () => {
    it('leaves the app', async () => {
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

  describe('when the user tries to leave the app', () => {
    before(() => {
      apiGetUserAccount = mockUserAccount()
      apiDeletePersonalAppCollaborator = mockCollaboratorsPersonalAppDeleteFailure('myapp', 'raulb@heroku.com')
    })

    after(() => nock.cleanAll())

    it('shows an error if the heroku.delete() operation returns an error', async () => {
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
