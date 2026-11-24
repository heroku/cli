import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/teams/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  team: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {team: {list: sinon.stub()}}
}

describe('heroku teams', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows the teams you are a member of', async function () {
    const teamList = [
      {name: 'team b', role: 'admin', type: 'team'},
      {name: 'enterprise b', role: 'admin', type: 'enterprise'},
      {name: 'team a', role: 'collaborator', type: 'team'},
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
    ]
    fakePlatform.team.list.resolves(teamList)

    const {result, stderr, stdout} = await runCommand(Cmd, [])
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
    expect(fakePlatform.team.list.calledOnceWithExactly()).to.equal(true)
    expect(result).to.equal(teamList)
    expect(teamList.map(team => team.name)).to.deep.equal(['team b', 'enterprise b', 'team a', 'enterprise a'])
  })

  it('returns and outputs teams in API order as json', async function () {
    const teamList = [
      {name: 'team b', role: 'admin', type: 'team'},
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
    ]
    fakePlatform.team.list.resolves(teamList)

    const {result, stderr, stdout} = await runCommand(Cmd, ['--json'])

    expect(stderr).to.equal('')
    expect(JSON.parse(stdout)).to.deep.equal(teamList)
    expect(result).to.equal(teamList)
    expect(fakePlatform.team.list.calledOnceWithExactly()).to.equal(true)
  })
})
