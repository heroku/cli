import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/apps/join.js'
import runCommand from '../../../helpers/legacy-run-command.js'
import {userAccount} from '../../../helpers/stubs/get.js'
import {teamAppCollaborators} from '../../../helpers/stubs/post.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

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
      code: 403, description: {error: 'You do not have access to the team heroku-tools.', id: 'forbidden'},
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
