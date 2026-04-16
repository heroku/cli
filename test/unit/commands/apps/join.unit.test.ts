import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/apps/join.js'
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
    const {stderr, stdout}  = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stdout, '')
    expectOutput(stderr, 'Joining ⬢ myapp... done')
    apiGetUserAccount.done()
    apiPostCollaborators.done()
  })

  it('is forbidden from joining the app', async function () {
    const response = {
      code: 403, description: {error: 'You do not have access to the team heroku-tools.', id: 'forbidden'},
    }
    apiPostCollaborators = teamAppCollaborators('gandalf@heroku.com', [], response)
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(error).to.exist
    expect(error!.body.error).to.eq('You do not have access to the team heroku-tools.')
    apiGetUserAccount.done()
    apiPostCollaborators.done()
  })
})
