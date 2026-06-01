import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/teams/index.js'
import {teams} from '../../../helpers/stubs/get.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('heroku teams', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows the teams you are a member of', async function () {
    teams()
    const {stderr, stdout} = await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Team         Role')
    const expected = removeAllWhitespace(`
    enterprise a collaborator
    enterprise b admin
    team a       collaborator
    team b       admin
    `)
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
    expect(stderr).to.be.empty
  })
})
