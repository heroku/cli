import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import nock from 'nock'
import Cmd from '../../../../src/commands/orgs/index.js'
import runCommand from '../../../helpers/runCommand.js'
import {teams} from '../../../helpers/stubs/get.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('heroku teams', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows Enterprise teams only when passing the --enterprise flag', async function () {
    const apiGetTeams = teams()
    await runCommand(Cmd, [
      '--enterprise',
    ])
    const actual = removeAllWhitespace(stdout.output)
    const expected = removeAllWhitespace('enterprise a collaborator \n enterprise b admin')
    expect(actual).to.include(expected)
    expect('').to.eq(stderr.output)
    return apiGetTeams.done()
  })

  it('shows teams', async function () {
    const apiGetTeamsOnly = teams([
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'}, {name: 'enterprise b', role: 'admin', type: 'enterprise'},
    ])
    await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout.output)
    const expected = removeAllWhitespace('enterprise a collaborator \n enterprise b admin')
    expect(actual).to.include(expected)
    expect('').to.eq(stderr.output)
    return apiGetTeamsOnly.done()
  })
})
