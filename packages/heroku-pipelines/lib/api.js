const keyBy = require('./key-by')

const V3_HEADER = 'application/vnd.heroku+json; version=3'
const FILTERS_HEADER = V3_HEADER + '.filters'

function getCoupling (heroku, app) {
  return heroku.get(`/apps/${app}/pipeline-couplings`)
}

function postCoupling (heroku, pipeline, app, stage) {
  return heroku.post('/pipeline-couplings', {
    body: { app, pipeline, stage }
  })
}

function patchCoupling (heroku, id, stage) {
  return heroku.patch(`/pipeline-couplings/${id}`, { body: { stage } })
}

function deleteCoupling (heroku, id) {
  return heroku.delete(`/pipeline-couplings/${id}`)
}

function createCoupling (heroku, pipeline, app, stage) {
  return postCoupling(heroku, pipeline.id, app, stage)
}

function updateCoupling (heroku, app, stage) {
  return getCoupling(heroku, app)
           .then(coupling => patchCoupling(heroku, coupling.id, stage))
}

function removeCoupling (heroku, app) {
  return getCoupling(heroku, app)
           .then(coupling => deleteCoupling(heroku, coupling.id))
}

function listCouplings (heroku, pipelineId) {
  return heroku.get(`/pipelines/${pipelineId}/pipeline-couplings`)
}

function getPipeline (heroku, id) {
  return heroku.get(`/pipelines/${id}`)
}

function findPipelineByName (heroku, idOrnName) {
  return heroku.get(`/pipelines?eq[name]=${idOrnName}`)
}

function createPipeline (heroku, name) {
  return heroku.post('/pipelines', { body: { name } })
}

function createAppSetup (heroku, body) {
  return heroku.post('/app-setups', { body })
}

function getAppFilter (heroku, appIds) {
  return heroku.request({
    method: 'POST',
    path: `/filters/apps`,
    headers: { 'Accept': FILTERS_HEADER },
    body: { in: { id: appIds } }
  })
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

function getAccountFeature (heroku, feature) {
  return heroku.get(`/account/features/${feature}`)
}

function getAppSetup (heroku, buildId) {
  return heroku.get(`/app-setups/${buildId}`)
}

module.exports = {
  createAppSetup,
  createCoupling,
  createPipeline,
  deleteCoupling,
  getAccountFeature,
  getAppFilter,
  getAppSetup,
  getCoupling,
  getPipeline,
  findPipelineByName,
  listCouplings,
  listPipelineApps,
  patchCoupling,
  postCoupling,
  removeCoupling,
  updateCoupling,
  V3_HEADER
}
