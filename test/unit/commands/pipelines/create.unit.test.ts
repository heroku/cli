import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('pipelines:create', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('successful pipeline creation', function () {
    context('when not specifying ownership', function () {
      it('creates a pipeline with default user ownership', async function () {
        api
          .post('/pipeline-couplings')
          .reply(201, {id: '0123', stage: 'production'})
          .get('/users/~')
          .reply(200, {id: '1234-567'})
          .post('/pipelines', {
            generation: {name: 'fir'},
            name: 'example-pipeline',
            owner: {id: '1234-567', type: 'user'},
          })
          .reply(201, {
            id: '0123',
            name: 'example-pipeline',
            owner: {id: '1234-567', type: 'user'},
          })

        nock('https://api.heroku.com')
          .get('/apps/example-app')
          .reply(200, {generation: 'fir', id: '0123', name: 'example-app'})

        const {stderr, stdout} = await runCommand([
          'pipelines:create',
          '--app',
          'example-app',
          '--stage',
          'production',
          'example-pipeline',
        ])

        expect(stdout).to.equal('')
        expect(stderr).to.contain('Creating example-pipeline pipeline... done')
        expect(stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
      })
    })

    context('when specifying a team as owner', function () {
      it('creates a pipeline with team ownership', async function () {
        nock('https://api.heroku.com')
          .post('/pipeline-couplings')
          .reply(201, {id: '0123', stage: 'production'})
          .get('/teams/my-team')
          .reply(200, {id: '89-0123-456'})
          .post('/pipelines', {
            generation: {name: 'fir'},
            name: 'example-pipeline',
            owner: {id: '89-0123-456', type: 'team'},
          })
          .reply(201, {
            id: '0123',
            name: 'example-pipeline',
            owner: {id: '89-0123-456', type: 'team'},
          })

        nock('https://api.heroku.com')
          .get('/apps/example-app')
          .reply(200, {generation: 'fir', id: '0123', name: 'example-app'})

        const {stderr, stdout} = await runCommand([
          'pipelines:create',
          '--app',
          'example-app',
          '--stage',
          'production',
          '--team',
          'my-team',
          'example-pipeline',
        ])

        expect(stdout).to.equal('')
        expect(stderr).to.contain('Creating example-pipeline pipeline... done')
        expect(stderr).to.contain('Adding ⬢ example-app to example-pipeline pipeline as production... done')
      })
    })
  })
})
