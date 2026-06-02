import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/spaces/drains/get.js'

describe('spaces:drains:get', function () {
  const drain = {
    addon: null,
    created_at: '2016-03-23T18:31:50Z',
    id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
    token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
    updated_at: '2016-03-23T18:31:50Z',
    url: 'https://example.com',
  }
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
      .get('/spaces/my-space/log-drain')
      .reply(200, drain)
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows the log drain', async function () {
    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(stdout).to.eq('https://example.com (d.a55ecbe1-5513-4d19-91e4-58a08b419d19)\n')
  })

  it('shows the log drain --json', async function () {
    const {stdout} = await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout)).to.eql(drain)
  })
})
