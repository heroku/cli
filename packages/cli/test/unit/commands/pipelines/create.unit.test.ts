/* eslint-disable mocha/no-setup-in-describe */
import {expect, test} from '@oclif/test'

describe('pipelines:create', function () {
  describe('successful pipeline creation', function () {
    context('when not specifying ownership', function () {
      test
        .stderr()
        .stdout()
        .nock('https://api.heroku.com', api =>
          api
            .post('/pipeline-couplings')
            .reply(201, {id: '0123', stage: 'production'})
            .get('/users/~')
            .reply(200, {id: '1234-567'})
            .post('/pipelines', {name: 'example-pipeline', owner: {id: '1234-567', type: 'user'}, generation: {name: 'fir'}})
            .reply(201, {
              name: 'example-pipeline',
              id: '0123',
              owner: {id: '1234-567', type: 'user'},
            }),
        )
        .nock('https://api.heroku.com', api => {
          api
            .get('/apps/example-app')
            .reply(200, {id: '0123', name: 'example-app', generation: 'fir'})
        })
        .command([
          'pipelines:create',
          '--app',
          'example-app',
          '--stage',
          'production',
          'example-pipeline',
        ])
        .it('creates a pipeline with default user ownership', ctx => {
          expect(ctx.stdout).to.equal('')
          expect(ctx.stderr).to.contain('Creating example-pipeline pipeline... done')
          expect(ctx.stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
        })
    })

    context('when specifying a team as owner', function () {
      test
        .stderr()
        .stdout()
        .nock('https://api.heroku.com', api =>
          api
            .post('/pipeline-couplings')
            .reply(201, {id: '0123', stage: 'production'})
            .get('/teams/my-team')
            .reply(200, {id: '89-0123-456'})
            .post('/pipelines', {name: 'example-pipeline', owner: {id: '89-0123-456', type: 'team'}, generation: {name: 'fir'}})
            .reply(201, {
              name: 'example-pipeline',
              id: '0123',
              owner: {id: '89-0123-456', type: 'team'},
            }),
        )
        .nock('https://api.heroku.com', api => {
          api
            .get('/apps/example-app')
            .reply(200, {id: '0123', name: 'example-app', generation: 'fir'})
        })
        .command([
          'pipelines:create',
          '--app',
          'example-app',
          '--stage',
          'production',
          '--team',
          'my-team',
          'example-pipeline',
        ])
        .it('creates a pipeline with team ownership', ctx => {
          expect(ctx.stdout).to.equal('')
          expect(ctx.stderr).to.contain('Creating example-pipeline pipeline... done')
          expect(ctx.stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
        })
    })
  })
})
