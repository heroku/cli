import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {App, Pipeline, PipelineCoupling} from './types/fir'

export const V3_HEADER = 'application/vnd.heroku+json; version=3'
export const SDK_HEADER = 'application/vnd.heroku+json; version=3.sdk'
export const FILTERS_HEADER = `${V3_HEADER}.filters`
export const PIPELINES_HEADER = `${V3_HEADER}.pipelines`
const CI_HEADER = `${V3_HEADER}.ci`

export function createAppSetup(heroku: APIClient, body: {body: any}) {
  return heroku.post<Heroku.AppSetup>('/app-setups', {body})
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
  return heroku.request<Heroku.Pipeline>('/pipelines', {
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

export interface PipelineCouplingSdk extends Required<PipelineCoupling> {
  generation: 'fir' | 'cedar'
}

export function getCoupling(heroku: APIClient, app: string) {
  return heroku.get<PipelineCouplingSdk>(`/apps/${app}/pipeline-couplings`, {
    headers: {Accept: SDK_HEADER},
  })
}

export function getPipeline(heroku: APIClient, id: string) {
  return heroku.request<Pipeline>(`/pipelines/${id}`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER},
  })
}

export function updatePipeline(heroku: APIClient, id: string, body: Heroku.Pipeline) {
  return heroku.patch<Heroku.Pipeline>(`/pipelines/${id}`, {
    body,
  })
}

export function getTeam(heroku: APIClient, teamId: any) {
  return heroku.get<Heroku.Team>(`/teams/${teamId}`)
}

function getAppFilter(heroku: APIClient, appIds: Array<string>) {
  return heroku.request<Array<App>>('/filters/apps', {
    method: 'POST',
    headers: {Accept: FILTERS_HEADER, Range: 'id ..; max=1000;'},
    body: {in: {id: appIds}},
  })
}

export function getAccountInfo(heroku: APIClient, id = '~') {
  return heroku.get<Heroku.Account>(`/users/${id}`)
}

export function getAppSetup(heroku: APIClient, buildId: any) {
  return heroku.get<Heroku.AppSetup>(`/app-setups/${buildId}`)
}

function listCouplings(heroku: APIClient, pipelineId: string) {
  return heroku.get<Array<PipelineCouplingSdk>>(`/pipelines/${pipelineId}/pipeline-couplings`, {
    headers: {Accept: SDK_HEADER},
  })
}

export interface AppWithPipelineCoupling extends App {
  pipelineCoupling: PipelineCouplingSdk
  [k: string]: unknown
}

export async function listPipelineApps(heroku: APIClient, pipelineId: string): Promise<Array<AppWithPipelineCoupling>> {
  const {body: couplings} = await listCouplings(heroku, pipelineId)
  const appIds = couplings.map(coupling => coupling.app.id || '')
  const {body: apps} = await getAppFilter(heroku, appIds)
  return apps.map(app => {
    return {
      ...app,
      pipelineCoupling: couplings.find(coupling => coupling.app.id === app.id),
    } as AppWithPipelineCoupling
  })
}

export function patchCoupling(heroku: APIClient, id: string, stage: string) {
  return heroku.patch<Heroku.PipelineCoupling>(`/pipeline-couplings/${id}`, {body: {stage}})
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
    headers: {Accept: SDK_HEADER, Range: 'version ..; order=desc'},
    partial: true,
  })
}

export function getPipelineConfigVars(heroku: APIClient, pipelineID: string) {
  return heroku.request<Heroku.ConfigVars>(`/pipelines/${pipelineID}/stage/test/config-vars`, {
    method: 'GET',
    headers: {Accept: PIPELINES_HEADER},
  })
}

export function setPipelineConfigVars(heroku: APIClient, pipelineID: string, body: Heroku.ConfigVars | Record<string, null>) {
  return heroku.request<Heroku.ConfigVars>(`/pipelines/${pipelineID}/stage/test/config-vars`, {
    method: 'PATCH',
    headers: {Accept: PIPELINES_HEADER},
    path: `/pipelines/${pipelineID}/stage/test/config-vars`,
    body,
  })
}

export async function createTestRun(heroku: APIClient, body: Heroku.TestRun) {
  const headers = {
    Accept: CI_HEADER,
  }

  return heroku.request<Heroku.TestRun>('/test-runs', {
    headers,
    method: 'POST',
    body,
  })
}

export async function getTestNodes(heroku: APIClient, testRunIdD: string) {
  return heroku.request<Heroku.TestRun>(`/test-runs/${testRunIdD}/test-nodes`, {
    headers: {
      Authorization: `Bearer ${heroku.auth}`,
      Accept: CI_HEADER,
    },
  })
}

export function updateTestRun(heroku: APIClient, id: string, body: Heroku.TestRun) {
  return heroku.request<Heroku.TestRun>(`/test-runs/${id}`, {
    body,
    method: 'PATCH',
    headers: {
      Accept: CI_HEADER,
    },
  })
}
