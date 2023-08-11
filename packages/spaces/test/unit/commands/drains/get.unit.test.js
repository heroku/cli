'use strict'
/* globals beforeEach */

let nock = require('nock')
let cmds = require('../../../../commands/drains/get')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

cmds.forEach(cmd => {
  describe(`${cmd.topic}:${cmd.command}`, function () {
    beforeEach(() => cli.mockConsole())

    it('shows the log drain', function () {
      let api = nock('https://api.heroku.com:443')
        .get('/spaces/my-space/log-drain')
        .reply(200, {
          addon: null,
          created_at: '2016-03-23T18:31:50Z',
          id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
          token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
          updated_at: '2016-03-23T18:31:50Z',
          url: 'https://example.com',
        })
      return cmd.run({flags: {space: 'my-space'}})
        .then(() => expect(cli.stdout).to.equal(
          `https://example.com (d.a55ecbe1-5513-4d19-91e4-58a08b419d19)\n`,
        )).then(() => api.done())
    })

    it('shows the log drain --json', function () {
      let drain = {
        addon: null,
        created_at: '2016-03-23T18:31:50Z',
        id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
        token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
        updated_at: '2016-03-23T18:31:50Z',
        url: 'https://example.com',
      }

      let api = nock('https://api.heroku.com:443')
        .get('/spaces/my-space/log-drain')
        .reply(200, drain)
      return cmd.run({flags: {space: 'my-space', json: true}})
        .then(() => expect(JSON.parse(cli.stdout)).to.eql(drain))
        .then(() => api.done())
    })
  })
})

