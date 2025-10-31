import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/index.js'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import {expect} from 'chai'
import {Errors} from '@oclif/core'
import stripAnsi from 'strip-ansi'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('spaces', function () {
  const now = new Date()
  const spaces = [{
    name: 'my-space',
    team: {name: 'my-team'},
    region: {name: 'my-region'},
    state: 'allocated',
    created_at: now.toISOString(),
    generation: 'cedar',
  }]

  afterEach(function () {
    nock.cleanAll()
  })

  it('shows spaces', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces')
      .reply(200, spaces)

    await runCommand(Cmd, [])

    api.done()

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('Name     Team    Region    State     Generation Created At'))
    expect(actual).to.include(removeAllWhitespace(`my-space my-team my-region allocated cedar      ${now.toISOString()}`))
  })

  it('shows spaces with --json', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces')
      .reply(200, spaces)

    await runCommand(Cmd, ['--json'])

    api.done()
    expect(JSON.parse(stdout.output)).to.deep.eq(spaces)
  })

  it('shows spaces scoped by teams', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces')
      .reply(200, spaces.concat([{
        name: 'other-space',
        team: {name: 'other-team'},
        region: {name: 'my-region'},
        state: 'allocated',
        created_at: now.toISOString(),
        generation: 'cedar',
      }]))

    await runCommand(Cmd, ['--team', 'my-team'])

    api.done()
    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('Name     Team    Region    State     Generation Created At'))
    expect(actual).to.include(removeAllWhitespace(`my-space my-team my-region allocated cedar      ${now.toISOString()}`))
  })

  it('shows spaces team error message', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces')
      .reply(200, spaces)

    try {
      await runCommand(Cmd, ['--team', 'other-team'])
    } catch (error) {
      const {message} = error as Errors.CLIError
      expect(stripAnsi(message)).to.eq('No spaces in other-team.')
    }

    api.done()
  })

  it('shows spaces error message', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces')
      .reply(200, [])

    try {
      await runCommand(Cmd, [])
    } catch (error) {
      const {message} = error as Errors.CLIError
      expect(message).to.eq('You do not have access to any spaces.')
    }

    api.done()
  })
})
