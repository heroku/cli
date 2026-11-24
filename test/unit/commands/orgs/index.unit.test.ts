import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/orgs/index.js'
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

  it('shows Enterprise teams only when passing the --enterprise flag', async function () {
    const teamList = [
      {name: 'team b', role: 'admin', type: 'team'},
      {name: 'enterprise b', role: 'admin', type: 'enterprise'},
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
    ]
    fakePlatform.team.list.resolves(teamList)

    const {result, stderr, stdout} = await runCommand(Cmd, [
      '--enterprise',
    ])
    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace('enterprise a collaborator \n enterprise b admin')
    expect(actual).to.include(expected)
    expect(stderr).to.equal('')
    expect(result).to.deep.equal([teamList[1], teamList[2]])
    expect(fakePlatform.team.list.calledOnceWithExactly()).to.equal(true)
  })

  it('shows and returns teams in API order; --teams is a no-op', async function () {
    const teamList = [
      {name: 'team b', role: 'admin', type: 'team'},
      {name: 'enterprise b', role: 'admin', type: 'enterprise'},
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
      {name: 'team a', role: 'collaborator', type: 'team'},
    ]
    fakePlatform.team.list.resolves(teamList)

    const {result, stderr, stdout} = await runCommand(Cmd, ['--teams'])
    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace('enterprise a collaborator \n enterprise b admin \n team a collaborator \n team b admin')
    expect(actual).to.include(expected)
    expect(stderr).to.equal('')
    expect(result).to.equal(teamList)
    expect(fakePlatform.team.list.calledOnceWithExactly()).to.equal(true)
    expect(teamList.map(team => team.name)).to.deep.equal(['team b', 'enterprise b', 'enterprise a', 'team a'])
  })

  it('outputs and returns enterprise teams in API order as json', async function () {
    const teamList = [
      {name: 'team b', role: 'admin', type: 'team'},
      {name: 'enterprise b', role: 'admin', type: 'enterprise'},
      {name: 'enterprise a', role: 'collaborator', type: 'enterprise'},
    ]
    fakePlatform.team.list.resolves(teamList)

    const {result, stderr, stdout} = await runCommand(Cmd, ['--enterprise', '--json'])

    expect(stderr).to.equal('')
    expect(JSON.parse(stdout)).to.deep.equal([teamList[1], teamList[2]])
    expect(result).to.deep.equal([teamList[1], teamList[2]])
    expect(fakePlatform.team.list.calledOnceWithExactly()).to.equal(true)
  })
})
