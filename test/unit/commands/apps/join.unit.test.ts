import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/apps/join.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import {userAccount} from '../../../helpers/stubs/get.js'
import {teamAppCollaborators} from '../../../helpers/stubs/post.js'

describe('heroku apps:join', function () {
  let apiGetUserAccount: nock.Scope
  let apiPostCollaborators: nock.Scope

  beforeEach(function () {
    apiGetUserAccount = userAccount('gandalf@heroku.com')
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('joins the app', async function () {
    apiPostCollaborators = teamAppCollaborators('gandalf@heroku.com')
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, 'Joining ⬢ myapp... done')
    apiGetUserAccount.done()
    apiPostCollaborators.done()
  })

  it('is forbidden from joining the app', async function () {
    const response = {
      code: 403, description: {id: 'forbidden', error: 'You do not have access to the team heroku-tools.'},
    }
    apiPostCollaborators = teamAppCollaborators('gandalf@heroku.com', [], response)
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
