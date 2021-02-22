'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../../commands/drains/get')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

describe('drains:get', function () {
  beforeEach(() => cli.mockConsole())

  it('shows the log drain', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/log-drain')
      .reply(200, {
        addon: null,
        created_at: '2016-03-23T18:31:50Z',
        id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
        token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
        updated_at: '2016-03-23T18:31:50Z',
        url: 'https://example.com'
      })

    await cmd.run({ flags: { space: 'my-space' } })

    expect(cli.stdout).to.equal(
      `https://example.com (d.a55ecbe1-5513-4d19-91e4-58a08b419d19)
`
    )

    return api.done()
  })

  it('shows the log drain --json', async function () {
    let drain = {
      addon: null,
      created_at: '2016-03-23T18:31:50Z',
      id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
      token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
      updated_at: '2016-03-23T18:31:50Z',
      url: 'https://example.com'
    }

    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/log-drain')
      .reply(200, drain)

    await cmd.run({ flags: { space: 'my-space', json: true } })

    expect(JSON.parse(cli.stdout)).to.eql(drain)

    return api.done()
  })
})
