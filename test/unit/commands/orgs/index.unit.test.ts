import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/orgs/index.js'
import {teams} from '../../../helpers/stubs/get.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('heroku teams', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows Enterprise teams only when passing the --enterprise flag', async function () {
    const apiGetTeams = teams()
    const {stderr, stdout} = await runCommand(Cmd, [
      '--enterprise',
    ])
    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace('enterprise a collaborator \n enterprise b admin')
    expect(actual).to.include(expected)
    expect('').to.eq(stderr)
    return apiGetTeams.done()
  })

  it('shows teams', async function () {
    const apiGetTeamsOnly = teams([
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'}, {name: 'enterprise b', role: 'admin', type: 'enterprise'},
    ])
    const {stderr, stdout} = await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace('enterprise a collaborator \n enterprise b admin')
    expect(actual).to.include(expected)
    expect('').to.eq(stderr)
    return apiGetTeamsOnly.done()
  })
})
