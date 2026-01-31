import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/teams/index.js'
import runCommand from '../../../helpers/runCommand.js'
import {teams} from '../../../helpers/stubs/get.js'
import nock from 'nock'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'
import {expect} from 'chai'

describe('heroku teams', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows the teams you are a member of', async function () {
    teams()
    await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Team         Role')
    const expected = removeAllWhitespace(`
    enterprise a collaborator
    enterprise b admin
    team a       collaborator
    team b       admin
    `)
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
    expect(stderr.output).to.be.empty
  })
})
