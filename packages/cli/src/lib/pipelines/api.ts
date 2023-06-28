import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {keyBy} from 'lodash'

export const V3_HEADER = 'application/vnd.heroku+json; version=3'
export const FILTERS_HEADER = `${V3_HEADER}.filters`
export const PIPELINES_HEADER = `${V3_HEADER}.pipelines`

export function createAppSetup(heroku: APIClient, body: {body: any}) {
  return heroku.post('/app-setups', {body})
}

export function postCoupling(heroku: APIClient, pipeline: any, app: any, stage: string) {
  return heroku.post('/pipeline-couplings', {
    body: {app, pipeline, stage},
  })
}

export function createCoupling(heroku: APIClient, pipeline: any, app: string, stage: string) {
  return postCoupling(heroku, pipeline.id, app, stage)
}

export function createPipeline(heroku: APIClient, name: any, owner: any) {
  return heroku.request('/pipelines', {
    method: 'POST',
    headers: {Accept: PIPELINES_HEADER},
    body: {name, owner},
  })
}

export function createPipelineTransfer(heroku: APIClient, pipeline: Heroku.Pipeline) {
  return heroku.post('/pipeline-transfers', {
    body: pipeline,
  })
}

function deleteCoupling(heroku: APIClient, id: string) {
  return heroku.delete(`/pipeline-couplings/${id}`)
}

export function destroyPipeline(heroku: APIClient, name: any, pipelineId: any) {
  return heroku.request(`/pipelines/${pipelineId}`, {
    method: 'DELETE',
    headers: {Accept: PIPELINES_HEADER},
    body: {name},
  })
}

export function findPipelineByName(heroku: APIClient, idOrName: string) {
  return heroku.request<Heroku.Pipeline[]>(`/pipelines?eq[name]=${idOrName}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER},
  })
}

export function getCoupling(heroku: APIClient, app: string) {
  return heroku.get<Heroku.PipelineCoupling>(`/apps/${app}/pipeline-couplings`)
}

export function getPipeline(heroku: APIClient, id: string) {
  return heroku.request<Heroku.Pipeline>(`/pipelines/${id}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER},
  })
}

export function updatePipeline(heroku: APIClient, id: string, body: Heroku.Pipeline) {
  return heroku.patch<Heroku.Pipeline>(`/pipelines/${id}`, {
    body,
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
    headers: {Accept: FILTERS_HEADER, Range: 'id ..; max=1000;'},
    body: {in: {id: appIds}},
  })
}

export function getAccountInfo(heroku: APIClient, id = '~') {
  return heroku.get<Heroku.Account>(`/users/${id}`)
}

export function getAppSetup(heroku: APIClient, buildId: any) {
  return heroku.get(`/app-setups/${buildId}`)
}

function listCouplings(heroku: APIClient, pipelineId: string) {
  return heroku.get<Array<Heroku.PipelineCoupling>>(`/pipelines/${pipelineId}/pipeline-couplings`)
}

export function listPipelineApps(heroku: APIClient, pipelineId: string): Promise<Array<Heroku.App>> {
  return listCouplings(heroku, pipelineId).then(({body: couplings}) => {
    const appIds = couplings.map(coupling => (coupling.app && coupling.app.id) || '')

    return getAppFilter(heroku, appIds).then(({body: apps}) => {
      const couplingsByAppId = keyBy(couplings, coupling => coupling.app && coupling.app.id)
      return apps.map(app => {
        return {
          ...app,
          coupling: couplingsByAppId[app.id!],
        }
      })
    })
  })
}

export function patchCoupling(heroku: APIClient, id: string, stage: string) {
  return heroku.patch(`/pipeline-couplings/${id}`, {body: {stage}})
}

export function removeCoupling(heroku: APIClient, app: string) {
  return getCoupling(heroku, app)
    .then(({body}) => {
      return deleteCoupling(heroku, body.id!)
    })
}

export function updateCoupling(heroku: APIClient, app: string, stage: string) {
  return getCoupling(heroku, app)
    .then(({body: coupling}) => patchCoupling(heroku, coupling.id!, stage))
}

export function getReleases(heroku: APIClient, appId: string) {
  return heroku.get<Array<Heroku.Release>>(`/apps/${appId}/releases`, {
    headers: {Accept: V3_HEADER, Range: 'version ..; order=desc'},
    partial: true,
  })
}
