import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
// tslint:disable-next-line: no-unused
import http from 'http-call'

import keyBy from 'lodash.keyby'

const V3_HEADER = 'application/vnd.heroku+json; version=3'
const FILTERS_HEADER = `${V3_HEADER}.filters`
const PIPELINES_HEADER = `${V3_HEADER}.pipelines`

export function createAppSetup(heroku: APIClient, body: {body: any}) {
  return heroku.post('/app-setups', {body})
}

export function createCoupling(heroku: APIClient, pipeline: any, app: string, stage: string) {
  return postCoupling(heroku, pipeline.id, app, stage)
}

export function createPipeline(heroku: APIClient, name: any, owner: any) {
  return heroku.request('/pipelines', {
    method: 'POST',
    headers: {Accept: PIPELINES_HEADER},
    body: {name, owner}
  })
}

// function deleteCoupling(heroku: APIClient, id) {
//   return heroku.delete(`/pipeline-couplings/${id}`)
// }

export function findPipelineByName(heroku: APIClient, idOrName: string) {
  return heroku.request<Heroku.Pipeline[]>(`/pipelines?eq[name]=${idOrName}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER}
  })
}

// function getCoupling(heroku: APIClient, app) {
//   return heroku.get(`/apps/${app}/pipeline-couplings`)
// }

export function getPipeline(heroku: APIClient, id: string) {
  return heroku.request<Heroku.Pipeline>(`/pipelines/${id}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER}
  })
}

// function getApp(heroku: APIClient, app) {
//   return heroku.get(`/apps/${app}`)
// }

export function getTeam(heroku: APIClient, teamId: any) {
  return heroku.get<Heroku.Team>(`/teams/${teamId}`)
}

function getAppFilter(heroku: APIClient, appIds: Array<string>) {
  return heroku.request<Array<Heroku.App>>('/filters/apps', {
    method: 'POST',
    headers: {Accept: FILTERS_HEADER},
    body: {in: {id: appIds}}
  })
}

export function getAccountInfo(heroku: APIClient, id = '~') {
  return heroku.get<Heroku.Account>(`/users/${id}`)
}

export function getAppSetup(heroku: APIClient, buildId: any) {
  return heroku.get(`/app-setups/${buildId}`)
}

export function listPipelineApps(heroku: APIClient, pipelineId: string) {
  return listCouplings(heroku, pipelineId).then(({body: couplings}) => {
    const appIds = couplings.map(coupling => coupling.app && coupling.app.id || '')

    return getAppFilter(heroku, appIds).then(({body: apps}) => {
      const couplingsByAppId = keyBy(couplings, coupling => coupling.app && coupling.app.id)
      apps.forEach(app => { app.coupling = couplingsByAppId[app.id!] })

      return apps
    })
  })
}

function listCouplings(heroku: APIClient, pipelineId: string) {
  return heroku.get<Array<Heroku.PipelineCoupling>>(`/pipelines/${pipelineId}/pipeline-couplings`)
}

// function patchCoupling(heroku: APIClient, id, stage) {
//   return heroku.patch(`/pipeline-couplings/${id}`, {body: {stage}})
// }

export function postCoupling(heroku: APIClient, pipeline: any, app: any, stage: string) {
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
