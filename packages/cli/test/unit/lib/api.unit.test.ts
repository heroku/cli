import {createTestRun, getTestNodes, updateTestRun} from '../../../src/lib/api'
import {getHerokuAPI} from '../../helpers/testInstances'
import * as nock from 'nock'
import {expect} from 'chai'
import {APIClient} from '@heroku-cli/command'

const TEST_RUN = {id: 'uuid-999'}

describe('api', () => {
  let herokuAPI: APIClient

  beforeEach(async () => {
    herokuAPI = await getHerokuAPI()
  })

  describe('#createTestRun', function () {
    it('creates test run', async function () {
      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .post('/test-runs', TEST_RUN)
        .reply(200, [TEST_RUN])

      const {body: testRun} = await createTestRun(herokuAPI, TEST_RUN)
      expect(testRun).to.deep.eq([TEST_RUN])
      api.done()
    })
  })

  describe('#testNodes', function () {
    it('gets a test run given a pipeline and number', async function () {
      const TEST_NODE = {test_run: {id: TEST_RUN.id}}

      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .get(`/test-runs/${TEST_RUN.id}/test-nodes`)
        .reply(200, [TEST_NODE])

      const {body: testNode} = await getTestNodes(herokuAPI, TEST_RUN.id)
      expect(testNode).to.deep.eq([TEST_NODE])
      api.done()
    })
  })

  describe('#updateTestRun', function () {
    it('updates test run', async function () {
      const updatedTestRun = {test_run: {commit_message: 'updated message'}}

      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .patch(`/test-runs/${TEST_RUN.id}`, {commit_message: 'updated message'})
        .reply(200, [updatedTestRun])

      const {body: testRun} = await updateTestRun(herokuAPI, TEST_RUN.id, {commit_message: 'updated message'})
      expect(testRun).to.deep.eq([updatedTestRun])
      api.done()
    })
  })
})
