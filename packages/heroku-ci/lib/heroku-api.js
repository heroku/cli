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
  createTestRun
}
