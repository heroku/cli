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

function* testRun (client, pipelineID, number) {
  return client.request({
    path: `/pipelines/${pipelineID}/test-runs/${number}`,
    headers: {
      Authorization: `Bearer ${client.options.token}`,
      Accept: VERSION_HEADER
    }
  })
}

function logStream (url, fn) {
  return https.get(url, fn)
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
  }).then((res) => res.body)
}

module.exports = {
  pipelineCoupling,
  pipelineRepository,
  testRun,
  logStream,
  createTestRun
}
