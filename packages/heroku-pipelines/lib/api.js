const keyBy = require('./key-by')

const V3_HEADER = 'application/vnd.heroku+json; version=3'
const FILTERS_HEADER = V3_HEADER + '.filters'

function getCoupling (heroku, app) {
  return heroku.request({
    method: 'GET',
    path: `/apps/${app}/pipeline-couplings`,
    headers: { 'Accept': V3_HEADER }
  })
}

function postCoupling (heroku, pipeline, app, stage) {
  return heroku.request({
    method: 'POST',
    path: '/pipeline-couplings',
    body: {app: app, pipeline: pipeline, stage: stage},
    headers: { 'Accept': V3_HEADER }
  })
}

function patchCoupling (heroku, id, stage) {
  return heroku.request({
    method: 'PATCH',
    path: `/pipeline-couplings/${id}`,
    body: {stage: stage},
    headers: { 'Accept': V3_HEADER }
  })
}

function deleteCoupling (heroku, id) {
  return heroku.request({
    method: 'DELETE',
    path: `/pipeline-couplings/${id}`,
    headers: { 'Accept': V3_HEADER }
  })
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
  return heroku.request({
    method: 'GET',
    path: `/pipelines/${pipelineId}/pipeline-couplings`,
    headers: { 'Accept': V3_HEADER }
  })
}

function getPipeline (heroku, id) {
  return heroku.request({
    method: 'GET',
    path: `/pipelines/${id}`,
    headers: { Accept: V3_HEADER }
  })
}

function findPipelineByName (heroku, idOrnName) {
  return heroku.request({
    method: 'GET',
    path: `/pipelines?eq[name]=${idOrnName}`
  })
}

function createPipeline (heroku, name) {
  return heroku.request({
    method: 'POST',
    path: '/pipelines',
    headers: { 'Accept': V3_HEADER },
    body: { name }
  })
}

function createAppSetup (heroku, body) {
  return heroku.request({
    method: 'POST',
    path: '/app-setups',
    headers: { 'Accept': V3_HEADER },
    body
  })
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
  return heroku.request({
    method: 'GET',
    path: `/account/features/${feature}`,
    headers: { Accept: V3_HEADER }
  })
}

exports.getCoupling = getCoupling
exports.postCoupling = postCoupling
exports.patchCoupling = patchCoupling
exports.deleteCoupling = deleteCoupling

exports.createCoupling = createCoupling
exports.updateCoupling = updateCoupling
exports.removeCoupling = removeCoupling
exports.listCouplings = listCouplings

exports.getPipeline = getPipeline
exports.findPipelineByName = findPipelineByName
exports.createPipeline = createPipeline

exports.createAppSetup = createAppSetup

exports.getAppFilter = getAppFilter

exports.listPipelineApps = listPipelineApps

exports.getAccountFeature = getAccountFeature

exports.V3_HEADER = V3_HEADER
