import {APIClient} from '@heroku-cli/command'
import {expect} from 'chai'
import nock from 'nock'

import {getPipeline, PipelineService} from '../../../../src/lib/ci/pipelines.js'
import {getHerokuAPI} from '../../../helpers/test-instances.js'

const PIPELINE = {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}
const FLAGS = {pipeline: PIPELINE.id}

describe('pipelines.ts', function () {
  let herokuAPI: APIClient

  beforeEach(async function () {
    herokuAPI = await getHerokuAPI()
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  describe('#getPipeline', function () {
    it('disambiguates when passing a pipeline', async function () {
      const api = nock('https://api.heroku.com')
        .get(`/pipelines/${PIPELINE.id}`)
        .reply(200, PIPELINE)

      const response = await getPipeline(FLAGS, herokuAPI)
      expect(response).to.deep.eq(PIPELINE)
      api.done()
    })

    it('uses pipeline-couplings when passing an application', async function () {
      const app = '123-app'

      const coupling = {pipeline: PIPELINE}

      const api = nock('https://api.heroku.com')
        .get(`/apps/${app}/pipeline-couplings`)
        .reply(200, coupling)

      const response = await getPipeline({app}, herokuAPI)
      expect(response).to.deep.eq(PIPELINE)
      api.done()
    })

    describe('remote inference', function () {
      it('resolves the pipeline via --remote flag when --pipeline and --app are absent', async function () {
        const app = 'my-heroku-app'
        const coupling = {pipeline: PIPELINE}

        // Subclass PipelineService to inject a controlled resolveAppFromRemote
        class TestPipelineService extends PipelineService {
          protected override resolveAppFromRemote(_remote: null | string | undefined): string | undefined {
            return app
          }
        }

        const api = nock('https://api.heroku.com')
          .get(`/apps/${app}/pipeline-couplings`)
          .reply(200, coupling)

        const service = new TestPipelineService(herokuAPI)
        const response = await service.getPipeline({app: null, pipeline: null, remote: 'heroku'})
        expect(response).to.deep.eq(PIPELINE)
        api.done()
      })

      it('resolves the pipeline via heroku.remote git config when --pipeline, --app, and --remote are absent', async function () {
        const app = 'git-config-app'
        const coupling = {pipeline: PIPELINE}

        // Subclass PipelineService to inject a controlled resolveAppFromRemote
        class TestPipelineService extends PipelineService {
          protected override resolveAppFromRemote(_remote: null | string | undefined): string | undefined {
            return app
          }
        }

        const api = nock('https://api.heroku.com')
          .get(`/apps/${app}/pipeline-couplings`)
          .reply(200, coupling)

        const service = new TestPipelineService(herokuAPI)
        const response = await service.getPipeline({app: null, pipeline: null})
        expect(response).to.deep.eq(PIPELINE)
        api.done()
      })

      it('errors when --pipeline, --app, and --remote are absent and no heroku git remote is found', async function () {
        class TestPipelineService extends PipelineService {
          protected override resolveAppFromRemote(_remote: null | string | undefined): string | undefined {
            return undefined
          }
        }

        const service = new TestPipelineService(herokuAPI)
        try {
          await service.getPipeline({app: null, pipeline: null})
          expect.fail('should have thrown')
        } catch (error: any) {
          expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
        }
      })
    })
  })
})
