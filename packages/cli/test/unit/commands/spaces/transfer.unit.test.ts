import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('spaces:transfer', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('yields success when the API succeeds', async function () {
    const space = 'dimension-c137'
    const team = 'jerry'
    api
      .post(`/spaces/${space}/transfer`, {
        new_owner: team,
      })
      .reply(201, {
        cidr: '10.0.0.0/16',
        created_at: '2019-01-09T22:31:33Z',
        data_cidr: '10.1.0.0/16',
        id: '5dd30c44-078f-4424-8585-cb98adf86723',
        name: space,
        organization: {id: '12cd6520-b000-4882-a655-8ae84a0132cb', name: team},
        region: {id: '3544427c-5b3b-4e1e-b01a-b66362573b26', name: 'virginia'},
        shield: false,
        state: 'allocated',
        team: {id: '12cd6520-b000-4882-a655-8ae84a0132cb', name: team},
        updated_at: '2019-07-16T10:19:10Z',
      })

    const {stderr} = await runCommand(['spaces:transfer', '--team', team, '--space', space])

    expect(stderr).to.contain('done')
  })

  it('yields the API error messages when the API fails', async function () {
    const space = 'dimension-c137'
    const team = 'jerry'
    const message = 'rikki tikki tavi!'
    const id = 'oops'
    api
      .post(`/spaces/${space}/transfer`, {new_owner: team})
      .reply(500, {id, message})

    const {error} = await runCommand(['spaces:transfer', '--team', team, '--space', space])

    expect(error?.message).to.eq(message)
  })
})
