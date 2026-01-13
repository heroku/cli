import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('spaces:drains:set', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('sets the log drain', async function () {
    api
      .put('/spaces/my-space/log-drain', {
        url: 'https://example.com',
      })
      .reply(200, {
        addon: null,
        created_at: '2016-03-23T18:31:50Z',
        id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
        token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
        updated_at: '2016-03-23T18:31:50Z',
        url: 'https://example.com',
      })

    const {stdout} = await runCommand(['spaces:drains:set', 'https://example.com', '--space', 'my-space'])

    expect(stdout).to.equal('Successfully set drain https://example.com for my-space.\n')
  })
})
