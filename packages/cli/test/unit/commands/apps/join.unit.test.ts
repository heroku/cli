import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/apps/join'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import {userAccount} from '../../../helpers/stubs/get'
import {teamAppCollaborators} from '../../../helpers/stubs/post'

describe('heroku apps:join', () => {
  let apiGetUserAccount: nock.Scope
  let apiPostCollaborators: nock.Scope
  beforeEach(() => {
    apiGetUserAccount = userAccount('raulb@heroku.com')
  })
  afterEach(() => nock.cleanAll())
  it('joins the app', async () => {
    apiPostCollaborators = teamAppCollaborators('raulb@heroku.com')
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, 'Joining myapp...\nJoining myapp... done\n')
    apiGetUserAccount.done()
    apiPostCollaborators.done()
  })
  it('is forbidden from joining the app', async () => {
    const response = {
      code: 403, description: {id: 'forbidden', error: 'You do not have access to the team heroku-tools.'},
    }
    apiPostCollaborators = teamAppCollaborators('raulb@heroku.com', [], response)
    let thrown = false
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .catch(function (error) {
        thrown = true
        expect(error.body.error).to.eq('You do not have access to the team heroku-tools.')
      })
    expect(thrown).to.eq(true)
    apiGetUserAccount.done()
    apiPostCollaborators.done()
  })
})
