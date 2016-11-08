const https = require('https')
const KOLKRABBI = 'https://kolkrabbi.herokuapp.com'
const VERSION_HEADER = 'application/vnd.heroku+json; version=3.ci'

function* pipelineCoupling (client, app) {
  return client.get(`/apps/${app}/pipeline-couplings`)
}

function* pipelineRepository (client, pipelineID) {
  return client.request({
    host: KOLKRABBI,
    path: `/pipelines/${pipelineID}/repository`,
    headers: {
      Authorization: `Bearer ${client.options.token}`
    }
  })
}

function* githubArchiveLink (client, user, repository, ref) {
  return client.request({
    host: KOLKRABBI,
    path: `/github/repos/${user}/${repository}/tarball/${ref}`,
    headers: {
      Authorization: `Bearer ${client.options.token}`
    }
  })
}

function* testRun (client, pipelineID, number) {
  return client.request({
    path: `/pipelines/${pipelineID}/test-runs/${number}`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER
    }
  })
}

function* testRuns (client, pipelineID) {
  return client.request({
    path: `/pipelines/${pipelineID}/test-runs`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER
    }
  })
}

function *latestTestRun (client, pipelineID) {
  const latestTestRuns = yield client.request({
    path: `/pipelines/${pipelineID}/test-runs`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER,
      Range: 'number ..; order=desc,max=1'
    }
  })

  return Promise.resolve(latestTestRuns[0])
}

function logStream (url, fn) {
  return https.get(url, fn)
}

function* createSource (client) {
  return yield client.post(`/sources`)
}

function* createTestRun (client, body) {
  const headers = {
    Accept: VERSION_HEADER
  }

  return client.request({
    headers: headers,
    method: 'POST',
    path: '/test-runs',
    body: body
  })
}

module.exports = {
  pipelineCoupling,
  pipelineRepository,
  githubArchiveLink,
  testRun,
  testRuns,
  latestTestRun,
  logStream,
  createSource,
  createTestRun
}
