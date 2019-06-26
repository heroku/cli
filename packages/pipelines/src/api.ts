import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import keyBy from './key-by'

const V3_HEADER = 'application/vnd.heroku+json; version=3'
const FILTERS_HEADER = `${V3_HEADER}.filters`
const PIPELINES_HEADER = `${V3_HEADER}.pipelines`

// function createAppSetup(heroku: APIClient, body: {body: any}) {
//   return heroku.post('/app-setups', {body})
// }

function createCoupling(heroku: APIClient, pipeline: Heroku.Pipeline, app: string, stage: string) {
  return postCoupling(heroku, pipeline.id, app, stage)
}

function createPipeline(heroku: APIClient, name: any, owner: any) {
  return heroku.request('/pipelines', {
    method: 'POST',
    headers: {Accept: PIPELINES_HEADER},
    body: {name, owner}
  })
}

// function deleteCoupling(heroku: APIClient, id) {
//   return heroku.delete(`/pipeline-couplings/${id}`)
// }

function findPipelineByName(heroku: APIClient, idOrName: string) {
  return heroku.request<Heroku.Pipeline[]>(`/pipelines?eq[name]=${idOrName}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER}
  })
}

// function getCoupling(heroku: APIClient, app) {
//   return heroku.get(`/apps/${app}/pipeline-couplings`)
// }

function getPipeline(heroku: APIClient, id: string) {
  return heroku.request<Heroku.Pipeline>(`/pipelines/${id}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER}
  })
}

// function getApp(heroku: APIClient, app) {
//   return heroku.get(`/apps/${app}`)
// }

function getTeam(heroku: APIClient, teamId: any) {
  return heroku.get(`/teams/${teamId}`)
}

// function getAppFilter(heroku: APIClient, appIds) {
//   return heroku.request('/filters/apps', {
//     method: 'POST',
//     headers: {Accept: FILTERS_HEADER},
//     body: {in: {id: appIds}}
//   })
// }

function getAccountInfo(heroku: APIClient, id = '~') {
  return heroku.get(`/users/${id}`)
}

// function getAppSetup(heroku: APIClient, buildId) {
//   return heroku.get(`/app-setups/${buildId}`)
// }

// function listPipelineApps(heroku: APIClient, pipelineId) {
//   return listCouplings(heroku, pipelineId).then(couplings => {
//     const appIds = couplings.map(coupling => coupling.app.id)

//     return getAppFilter(heroku, appIds).then(apps => {
//       const couplingsByAppId = keyBy(couplings,coupling => coupling.app.id)
//       apps.forEach(app => { app.coupling = couplingsByAppId[app.id] })

//       return apps
//     })
//   })
// }

// function listCouplings(heroku: APIClient, pipelineId) {
//   return heroku.get(`/pipelines/${pipelineId}/pipeline-couplings`)
// }

// function patchCoupling(heroku: APIClient, id, stage) {
//   return heroku.patch(`/pipeline-couplings/${id}`, {body: {stage}})
// }

function postCoupling(heroku: APIClient, pipeline: any, app: any, stage: string) {
  return heroku.post('/pipeline-couplings', {
    body: {app, pipeline, stage}
  })
}

// function removeCoupling(heroku: APIClient, app) {
//   return getCoupling(heroku, app)
//     .then(coupling => deleteCoupling(heroku, coupling.id))
// }

// function updateCoupling(heroku: APIClient, app, stage) {
//   return getCoupling(heroku, app)
//     .then(coupling => patchCoupling(heroku, coupling.id, stage))
// }

export {
  // createAppSetup,
  createCoupling,
  createPipeline,
  // deleteCoupling,
  findPipelineByName,
  getAccountInfo,
  // getAppFilter,
  // getAppSetup,
  // getApp,
  // getCoupling,
  getPipeline,
  getTeam,
  // listCouplings,
  // listPipelineApps,
  // patchCoupling,
  postCoupling,
  // removeCoupling,
  // updateCoupling,
  V3_HEADER
}
