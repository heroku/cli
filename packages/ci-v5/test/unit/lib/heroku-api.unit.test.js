
/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const Heroku = require('heroku-client')
const herokuAPI = require('../../../lib/heroku-api')

describe('heroku-api', function () {
  afterEach(() => nock.cleanAll())

  describe('#pipelineCoupling', function () {
    it('gets the pipeline coupling given an app', async function () {
      const app = 'sausages'
      const coupling = {pipeline: {id: '123-abc'}}
      const api = nock('https://api.heroku.com')
        .get(`/apps/${app}/pipeline-couplings`)
        .reply(200, coupling)

      const response = await herokuAPI.pipelineCoupling(new Heroku(), app)
      expect(response).to.deep.eq(coupling)
      api.done()
    })
  })

  describe('#pipelineRepository', function () {
    it('gets the pipeline repository given a pipeline', async function () {
      const pipeline = '123-abc'
      const repo = {repository: {name: 'heroku/heroku'}}
      const api = nock('https://kolkrabbi.heroku.com')
        .get(`/pipelines/${pipeline}/repository`)
        .reply(200, repo)

      const response = await herokuAPI.pipelineRepository(new Heroku(), pipeline)
      expect(response).to.deep.eq(repo)
      api.done()
    })
  })

  describe('#getDyno', function () {
    it('returns dyno information', async function () {
      const appID = '123-456-67-89'
      const dynoID = '01234567-89ab-cdef-0123-456789abcdef'
      const dyno = {
        id: dynoID,
        attach_url: 'rendezvous://rendezvous.runtime.heroku.com:5000/{rendezvous-id}',
        app: {id: appID},
      }

      const api = nock('https://api.heroku.com')
        .get(`/apps/${appID}/dynos/${dynoID}`)
        .reply(200, dyno)

      const response = await herokuAPI.getDyno(new Heroku(), appID, dynoID)
      expect(response).to.deep.eq(dyno)
      api.done()
    })
  })

  describe('#githubArchiveLink', function () {
    it('gets a GitHub archive link', async function () {
      const {user, repository} = ['heroku', 'heroku-ci']
      const ref = '123-abc'
      const archiveLink = {archive_link: 'https://example.com'}
      const api = nock('https://kolkrabbi.heroku.com')
        .get(`/github/repos/${user}/${repository}/tarball/${ref}`)
        .reply(200, archiveLink)

      const response = await herokuAPI.githubArchiveLink(new Heroku(), user, repository, ref)
      expect(response).to.deep.eq(archiveLink)
      api.done()
    })
  })

  describe('#testRun', function () {
    it('gets a test run given a pipeline and number', async function () {
      const pipeline = '123-abc'
      const number = 1
      const testRun = {number}
      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .get(`/pipelines/${pipeline}/test-runs/${number}`)
        .reply(200, testRun)

      const response = await herokuAPI.testRun(new Heroku(), pipeline, number)
      expect(response).to.deep.eq(testRun)
      api.done()
    })
  })

  describe('#testNodes', function () {
    it('gets a test run given a pipeline and number', async function () {
      const testRun = {id: 'uuid-999'}
      const testNode = {test_run: {id: testRun.id}}

      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .get(`/test-runs/${testRun.id}/test-nodes`)
        .reply(200, [testNode])

      const response = await herokuAPI.testNodes(new Heroku(), testRun.id)
      expect(response).to.deep.eq([testNode])
      api.done()
    })
  })

  describe('#testRuns', function () {
    it('gets test runs given a pipeline', async function () {
      const pipeline = '123-abc'
      const testRuns = [{id: '123'}]
      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .get(`/pipelines/${pipeline}/test-runs`)
        .reply(200, testRuns)

      const response = await herokuAPI.testRuns(new Heroku(), pipeline)
      expect(response).to.deep.eq(testRuns)
      api.done()
    })
  })

  describe('#latestTestRun', function () {
    it('gets the latest test run given a pipeline', async function () {
      const pipeline = '123-abc'
      const testRuns = [{number: 123}, {number: 122}]
      const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.ci'}})
        .get(`/pipelines/${pipeline}/test-runs`)
        .reply(200, testRuns)

      const response = await herokuAPI.latestTestRun(new Heroku(), pipeline)
      expect(response).to.deep.eq(testRuns[0])
      api.done()
    })
  })

  describe('#createSource', function () {
    it('creates a source', async function () {
      const source = {source_blob: {get_url: 'https://example.com/get', put_url: 'https://example.com/put'}}
      const api = nock('https://api.heroku.com')
        .post('/sources')
        .reply(201, source)

      const response = await herokuAPI.createSource(new Heroku())
      expect(response).to.deep.eq(source)
      api.done()
    })
  })

  describe('#configVars', function () {
    it('gets config vars', async function () {
      const id = '123'
      const config = {FOO: 'bar'}
      const api = nock('https://api.heroku.com')
        .get(`/pipelines/${id}/stage/test/config-vars`)
        .reply(200, config)

      const response = await herokuAPI.configVars(new Heroku(), id)
      expect(response).to.deep.eq(config)
      api.done()
    })
  })

  describe('#setConfigVars', function () {
    it('patches config vars', async function () {
      const id = '123'
      const config = {FOO: 'bar'}
      const api = nock('https://api.heroku.com')
        .patch(`/pipelines/${id}/stage/test/config-vars`)
        .reply(200, config)

      const response = await herokuAPI.setConfigVars(new Heroku(), id, config)
      expect(response).to.deep.eq(config)

      api.done()
    })
  })
})
