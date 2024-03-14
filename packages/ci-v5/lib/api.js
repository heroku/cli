const V3_HEADER = 'application/vnd.heroku+json; version=3'
const PIPELINES_HEADER = `${V3_HEADER}.pipelines`

function findPipelineByName(heroku, idOrName) {
  return heroku.request({
    method: 'GET',
    path: `/pipelines?eq[name]=${idOrName}`,
    headers: {Accept: PIPELINES_HEADER},
  })
}

function getPipeline(heroku, id) {
  return heroku.request({
    method: 'GET',
    path: `/pipelines/${id}`,
    headers: {Accept: PIPELINES_HEADER},
  })
}

module.exports = {
  findPipelineByName,
  getPipeline,
  V3_HEADER,
}
