import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import Cmd  from '../../../../src/commands/orgs'
import runCommand from '../../../helpers/runCommand'
import {teams} from '../../../helpers/stubs/get'

describe('heroku teams', () => {
  afterEach(() => nock.cleanAll())
  it('shows Enterprise teams only when passing the --enterprise flag', () => {
    const apiGetTeams = teams()
    return runCommand(Cmd, [
      '--enterprise',
    ])
      .then(() => expect(stdout.output).to.contain('enterprise a collaborator \n enterprise b admin'))
      .then(() => expect('').to.eq(stderr.output))
      .then(() => apiGetTeams.done())
  })
  it('shows teams', () => {
    const apiGetTeamsOnly = teams([
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'}, {name: 'enterprise b', role: 'admin', type: 'enterprise'},
    ])
    return runCommand(Cmd, [])
      .then(() => expect(stdout.output).to.contain('enterprise a collaborator \n enterprise b admin'))
      .then(() => expect('').to.eq(stderr.output))
      .then(() => apiGetTeamsOnly.done())
  })
})
