'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../commands/transfer')
const expect = require('chai').expect
const cli = require('heroku-cli-util')

describe('spaces:transfer', function () {
  beforeEach(() => cli.mockConsole())

  it('yields success when the API succeeds', function () {
    const space = 'dimension-c137'
    const team = 'jerry'
    const api = nock('https://api.heroku.com:443')
      .post(`/spaces/${space}/transfer`, {
        new_owner: team,
      })
      .reply(201,
        {
          created_at: '2019-01-09T22:31:33Z',
          id: '5dd30c44-078f-4424-8585-cb98adf86723',
          name: space,
          organization: {id: '12cd6520-b000-4882-a655-8ae84a0132cb', name: team},
          team: {id: '12cd6520-b000-4882-a655-8ae84a0132cb', name: team},
          region: {id: '3544427c-5b3b-4e1e-b01a-b66362573b26', name: 'virginia'},
          shield: false,
          state: 'allocated',
          cidr: '10.0.0.0/16',
          data_cidr: '10.1.0.0/16',
          updated_at: '2019-07-16T10:19:10Z',
        },
      )
    return cmd.run({flags: {team, space}})
      .then(() => expect(cli.stderr).to.contain('done'))
      .then(() => api.done())
  })

  it('yields the API error messages when the API fails', function () {
    const space = 'dimension-c137'
    const team = 'jerry'
    const message = 'rikki tikki tavi!'
    const id = 'oops'

    const api = nock('https://api.heroku.com:443')
      .post(`/spaces/${space}/transfer`, {new_owner: team})
      .reply(500, {id, message})

    return cmd.run({flags: {team, space}})
      .then(() => expect(cli.stderr).to.contain(message))
      .then(() => api.done())
  })
})
