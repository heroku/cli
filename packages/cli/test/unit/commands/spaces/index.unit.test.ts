import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import stripAnsi from 'strip-ansi'

import Cmd from '../../../../src/commands/spaces/index.js'
import runCommand from '../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

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
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows spaces', async function () {
    api
      .get('/spaces')
      .reply(200, spaces)

    await runCommand(Cmd, [])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('Name     Team    Region    State     Generation Created At'))
    expect(actual).to.include(removeAllWhitespace(`⬡ my-space my-team my-region allocated cedar      ${now.toISOString()}`))
  })

  it('shows spaces with --json', async function () {
    api
      .get('/spaces')
      .reply(200, spaces)

    await runCommand(Cmd, ['--json'])

    expect(JSON.parse(stdout.output)).to.deep.eq(spaces)
  })

  it('shows spaces scoped by teams', async function () {
    api
      .get('/spaces')
      .reply(200, spaces.concat([{
        created_at: now.toISOString(),
        generation: 'cedar',
        name: 'other-space',
        region: {name: 'my-region'},
        state: 'allocated',
        team: {name: 'other-team'},
      }]))

    await runCommand(Cmd, ['--team', 'my-team'])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('Name     Team    Region    State     Generation Created At'))
    expect(actual).to.include(removeAllWhitespace(`⬡ my-space my-team my-region allocated cedar      ${now.toISOString()}`))
  })

  it('shows spaces team error message', async function () {
    api
      .get('/spaces')
      .reply(200, spaces)

    try {
      await runCommand(Cmd, ['--team', 'other-team'])
    } catch (error) {
      const {message} = error as Errors.CLIError
      expect(stripAnsi(message)).to.eq('No spaces in other-team.')
    }
  })

  it('shows spaces error message', async function () {
    api
      .get('/spaces')
      .reply(200, [])

    try {
      await runCommand(Cmd, [])
    } catch (error) {
      const {message} = error as Errors.CLIError
      expect(message).to.eq('You do not have access to any spaces.')
    }
  })
})
