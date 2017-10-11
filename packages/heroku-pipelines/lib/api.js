const keyBy = require('./key-by')

const V3_HEADER = 'application/vnd.heroku+json; version=3'
const FILTERS_HEADER = `${V3_HEADER}.filters`
const PIPELINES_HEADER = `${V3_HEADER}.pipelines`

function createAppSetup (heroku, body) {
  return heroku.post('/app-setups', { body })
}

function createCoupling (heroku, pipeline, app, stage) {
  return postCoupling(heroku, pipeline.id, app, stage)
}

function createPipeline (heroku, name, owner) {
  return heroku.request({
    method: 'POST',
    path: '/pipelines',
    headers: { 'Accept': PIPELINES_HEADER },
    body: { name, owner }
  })
}

function deleteCoupling (heroku, id) {
  return heroku.delete(`/pipeline-couplings/${id}`)
}

function findPipelineByName (heroku, idOrName) {
  return heroku.request({
    method: 'GET',
    path: `/pipelines?eq[name]=${idOrName}`,
    headers: { 'Accept': PIPELINES_HEADER }
  })
}

function getCoupling (heroku, app) {
  return heroku.get(`/apps/${app}/pipeline-couplings`)
}

function getPipeline (heroku, id) {
  return heroku.request({
    method: 'GET',
    path: `/pipelines/${id}`,
    headers: { 'Accept': PIPELINES_HEADER }
  })
}

function getTeam (heroku, teamId) {
  return heroku.get(`/teams/${teamId}`)
}

function getAppFilter (heroku, appIds) {
  return heroku.request({
    method: 'POST',
    path: `/filters/apps`,
    headers: { 'Accept': FILTERS_HEADER },
    body: { in: { id: appIds } }
  })
}

function getAccountInfo (heroku, id = '~') {
  return heroku.get(`/users/${id}`)
}

function getAccountFeature (heroku, feature) {
  return heroku.get(`/account/features/${feature}`)
}

function getAppSetup (heroku, buildId) {
  return heroku.get(`/app-setups/${buildId}`)
}

function listPipelineApps (heroku, pipelineId) {
  return listCouplings(heroku, pipelineId).then((couplings) => {
    const appIds = couplings.map((coupling) => coupling.app.id)

    return getAppFilter(heroku, appIds).then((apps) => {
      const couplingsByAppId = keyBy(couplings, (coupling) => coupling.app.id)
      apps.forEach((app) => { app.coupling = couplingsByAppId[app.id] })

      return apps
    })
  })
}

function listCouplings (heroku, pipelineId) {
  return heroku.get(`/pipelines/${pipelineId}/pipeline-couplings`)
}

function patchCoupling (heroku, id, stage) {
  return heroku.patch(`/pipeline-couplings/${id}`, { body: { stage } })
}

function postCoupling (heroku, pipeline, app, stage) {
  return heroku.post('/pipeline-couplings', {
    body: { app, pipeline, stage }
  })
}

function removeCoupling (heroku, app) {
  return getCoupling(heroku, app)
           .then(coupling => deleteCoupling(heroku, coupling.id))
}

function updateCoupling (heroku, app, stage) {
  return getCoupling(heroku, app)
           .then(coupling => patchCoupling(heroku, coupling.id, stage))
}

module.exports = {
  createAppSetup,
  createCoupling,
  createPipeline,
  deleteCoupling,
  findPipelineByName,
  getAccountInfo,
  getAccountFeature,
  getAppFilter,
  getAppSetup,
  getCoupling,
  getPipeline,
  getTeam,
  listCouplings,
  listPipelineApps,
  patchCoupling,
  postCoupling,
  removeCoupling,
  updateCoupling,
  V3_HEADER
}
