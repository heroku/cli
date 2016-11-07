const KOLKRABBI = 'https://kolkrabbi.herokuapp.com'
const VERSION_HEADER = 'Accept: application/vnd.heroku+json; version=3.ci'

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

module.exports = {
  pipelineCoupling,
  pipelineRepository
}
