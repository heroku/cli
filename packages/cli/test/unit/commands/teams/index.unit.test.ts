import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/teams'
import runCommand from '../../../helpers/runCommand'
import {teams} from '../../../helpers/stubs/get'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'

describe.only('heroku teams', () => {
  afterEach(() => nock.cleanAll())

  it('shows the teams you are a member of', async () => {
    teams()
    await runCommand(Cmd, [])
    expectOutput(stdout.output, `
Team         Role
 ──────────── ────────────
 enterprise a collaborator
 enterprise b admin
 team a       collaborator
 team b       admin
`)
    expectOutput(stderr.output, '')
  })
})
