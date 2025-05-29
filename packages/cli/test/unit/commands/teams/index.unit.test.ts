import {stdout, stderr} from 'stdout-stderr'
// import Cmd from '../../../../src/commands/teams'
import runCommand from '../../../helpers/runCommand.js'
import {teams} from '../../../helpers/stubs/get.js'
import nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import heredoc from 'tsheredoc'

/*
describe('heroku teams', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows the teams you are a member of', async function () {
    teams()
    await runCommand(Cmd, [])
    expectOutput(heredoc(stdout.output), heredoc(`
    Team         Role
    ──────────── ────────────
    enterprise a collaborator
    enterprise b admin
    team a       collaborator
    team b       admin
    `))
    expectOutput(stderr.output, '')
  })
})

*/
