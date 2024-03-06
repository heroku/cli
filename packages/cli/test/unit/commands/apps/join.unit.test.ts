import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/apps/join'
import runCommand from '../../../helpers/runCommand'
import {userAccount} from '../../../helpers/stubs/get'
import {teamAppCollaborators} from '../../../helpers/stubs/post'

describe('heroku apps:join', () => {
  let apiGetUserAccount: nock.Scope
  let apiPostCollaborators: nock.Scope
  beforeEach(() => {
    apiGetUserAccount = userAccount('raulb@heroku.com')
  })
  afterEach(() => nock.cleanAll())
  it('joins the app', () => {
    apiPostCollaborators = teamAppCollaborators('raulb@heroku.com')
    return runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .then(() => expect('').to.eq(stdout.output))
      .then(() => expect('Joining myapp...\nJoining myapp... done\n').to.eq(stderr.output))
      .then(() => apiGetUserAccount.done())
      .then(() => apiPostCollaborators.done())
  })
  it('is forbidden from joining the app', () => {
    const response = {
      code: 403, description: {id: 'forbidden', error: 'You do not have access to the team heroku-tools.'},
    }
    apiPostCollaborators = teamAppCollaborators('raulb@heroku.com', [], response)
    let thrown = false
    return runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .then(() => apiGetUserAccount.done())
      .catch(function (error) {
        thrown = true
        expect(error.body.error).to.eq('You do not have access to the team heroku-tools.')
      })
      .then(function () {
        expect(thrown).to.eq(true)
      })
      .then(() => apiPostCollaborators.done())
  })
})
