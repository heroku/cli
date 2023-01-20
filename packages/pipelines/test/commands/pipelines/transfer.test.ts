import {expect, test} from '@oclif/test'
import nock from 'nock'

describe.only('pipelines:transfer', function () {
  const pipeline = {
    id: 'd214bea8-aaa0-4f98-91ba-e781cb26d50f',
    name: 'test-pipeline',
  }

  const team = {
    id: 'caee7555-c3ba-4959-a393-a0ae93bb958f',
    name: 'foo-team',
  }

  const account = {
    id: 'bcf91aa0-9465-4ad8-a38f-983cd177780f',
    email: 'user@example.com',
  }

  const coupling = {
    app: {
      id: '579a2433-7afd-421c-8b87-1b89b5cfbf10',
    },
  }

  const app = {
    id: coupling.app.id,
    name: 'my-app',
  }

  describe('team transfer',  function () {
    const api = nock('https://api.heroku.com')
    api.get(`/pipelines/${pipeline.id}`).reply(200, pipeline)
    api.get(`/pipelines/${pipeline.id}/pipeline-couplings`).reply(200, [coupling])
    api.post('/filters/apps').reply(200, [app])
    api.get(`/teams/${team.name}`).reply(200, team)

    const update = api.post('/pipeline-transfers', {
      new_owner: {id: team.id, type: 'team'},
      pipeline: {id: pipeline.id},
    }).reply(200, {})

    test
    .stderr()
    .command(['pipelines:transfer', `--pipeline=${pipeline.id}`, `--confirm=${pipeline.name}`, team.name])
    .it('transfers a team', ctx => {
      // todo: use setTimeout creatively
      expect(ctx.stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${team.name} team... done`)
      expect(update.isDone()).to.be.true
    })
  })

  describe('pipeline transfer', () => {
    const api = nock('https://api.heroku.com')
    api.get(`/pipelines/${pipeline.id}`).reply(200, pipeline)
    api.get(`/pipelines/${pipeline.id}/pipeline-couplings`).reply(200, [coupling])
    api.post('/filters/apps').reply(200, [app])
    api.get(`/users/${account.email}`).reply(200, account)

    const update = api.post('/pipeline-transfers', {
      new_owner: {id: account.id, type: 'user'},
      pipeline: {id: pipeline.id},
    }).reply(200, {})

    test
    .stderr()
    .command(['pipelines:transfer', `--pipeline=${pipeline.id}`, `--confirm=${pipeline.name}`, account.email])
    .it('transfers to an account', ctx => {
      expect(ctx.stderr).to.include(`Transferring ${pipeline.name} pipeline to the ${account.email} account... done`)
      expect(update.isDone()).to.be.true
    })
  })
})
