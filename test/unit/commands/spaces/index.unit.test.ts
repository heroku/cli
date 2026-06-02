import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {Errors} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Cmd from '../../../../src/commands/spaces/index.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  space: {list: sinon.SinonStub}
  withHeaders: sinon.SinonStub
}

function buildFakePlatform(): FakePlatform {
  const spaceStub = {list: sinon.stub()}
  const platform: FakePlatform = {
    space: spaceStub,
    withHeaders: sinon.stub(),
  }

  platform.withHeaders.returns({space: spaceStub})
  return platform
}

describe('spaces', function () {
  const now = new Date()
  const spaces = [{
    created_at: now.toISOString(),
    generation: 'cedar',
    name: 'my-space',
    region: {name: 'my-region'},
    state: 'allocated',
    team: {name: 'my-team'},
  }]
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows spaces', async function () {
    fakePlatform.space.list.resolves(spaces)

    const {stdout} = await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('Name     Team    Region    State     Generation Created At'))
    expect(actual).to.include(removeAllWhitespace(`⬡ my-space my-team my-region allocated cedar      ${now.toISOString()}`))
    expect(fakePlatform.withHeaders.calledOnceWithExactly({Accept: 'application/vnd.heroku+json; version=3.sdk'})).to.equal(true)
  })

  it('shows spaces with --json', async function () {
    fakePlatform.space.list.resolves(spaces)

    const {stdout} = await runCommand(Cmd, ['--json'])
    expect(JSON.parse(stdout)).to.deep.eq(spaces)
  })

  it('shows spaces scoped by teams', async function () {
    fakePlatform.space.list.resolves([...spaces, {
      created_at: now.toISOString(),
      generation: 'cedar',
      name: 'other-space',
      region: {name: 'my-region'},
      state: 'allocated',
      team: {name: 'other-team'},
    }])

    const {stdout} = await runCommand(Cmd, ['--team', 'my-team'])
    const actual = removeAllWhitespace(stdout)
    expect(actual).to.include(removeAllWhitespace('Name     Team    Region    State     Generation Created At'))
    expect(actual).to.include(removeAllWhitespace(`⬡ my-space my-team my-region allocated cedar      ${now.toISOString()}`))
  })

  it('shows spaces team error message', async function () {
    fakePlatform.space.list.resolves(spaces)

    try {
      await runCommand(Cmd, ['--team', 'other-team'])
    } catch (error) {
      const {message} = error as Errors.CLIError
      expect(ansis.strip(message)).to.eq('No spaces in other-team.')
    }
  })

  it('shows spaces error message', async function () {
    fakePlatform.space.list.resolves([])

    try {
      await runCommand(Cmd, [])
    } catch (error) {
      const {message} = error as Errors.CLIError
      expect(message).to.eq('You do not have access to any spaces.')
    }
  })
})
