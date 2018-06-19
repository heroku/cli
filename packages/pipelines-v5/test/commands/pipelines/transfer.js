'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines/transfer')
const assert = require('assert')

describe('pipelines:transfer', function () {
  beforeEach(() => cli.mockConsole())
  let api, pipeline, team, account, coupling, app

  beforeEach(function () {
    pipeline = {
      id: 'd214bea8-aaa0-4f98-91ba-e781cb26d50f',
      name: 'test-pipeline'
    }

    team = {
      id: 'caee7555-c3ba-4959-a393-a0ae93bb958f',
      name: 'foo-team'
    }

    account = {
      id: 'bcf91aa0-9465-4ad8-a38f-983cd177780f',
      email: 'user@example.com'
    }

    coupling = {
      app: {
        id: '579a2433-7afd-421c-8b87-1b89b5cfbf10'
      }
    }

    app = {
      id: coupling.app.id,
      name: 'my-app'
    }

    api = nock(`https://api.heroku.com`)
    api.get(`/pipelines/${pipeline.id}`).reply(200, pipeline)
    api.get(`/pipelines/${pipeline.id}/pipeline-couplings`).reply(200, [coupling])
    api.post(`/filters/apps`).reply(200, [app])
  })

  it('transfers to a team', function () {
    api.get(`/teams/${team.name}`).reply(200, team)
    const update = api.post(`/pipeline-transfers`, {
      new_owner: { id: team.id, type: 'team' },
      pipeline: { id: pipeline.id }
    }).reply(200, {})

    return cmd.run({
      flags: { pipeline: pipeline.id, confirm: pipeline.name },
      args: { owner: team.name }
    }).then(() => {
      const output = cli.stderr
      output.should.contain(
        `Transferring ${pipeline.name} pipeline to the ${team.name} team... done`
      )
      assert.ok(update.isDone(), 'Pipeline should be updated')
    })
  })

  it('transfers to an account', function () {
    api.get(`/users/${account.email}`).reply(200, account)
    const update = api.post(`/pipeline-transfers`, {
      new_owner: { id: account.id, type: 'user' },
      pipeline: { id: pipeline.id }
    }).reply(200, {})

    return cmd.run({
      flags: { pipeline: pipeline.id, confirm: pipeline.name },
      args: { owner: account.email }
    }).then(() => {
      const output = cli.stderr
      output.should.contain(
        `Transferring ${pipeline.name} pipeline to the ${account.email} account... done`
      )
      assert.ok(update.isDone(), 'Pipeline should be updated')
    })
  })
})
