import {getPipeline} from '../../../../src/lib/ci/pipelines.js'
import nock from 'nock'
import {expect} from 'chai'
import {getHerokuAPI} from '../../../helpers/testInstances.js'
import {APIClient} from '@heroku-cli/command'

const PIPELINE = {
  id: '123e4567-e89b-12d3-a456-426655440000',
  name: 'test-pipeline',
}
const FLAGS = {pipeline: PIPELINE.id}

/*
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
  })
})

*/
