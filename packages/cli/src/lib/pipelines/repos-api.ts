import {APIClient} from '@heroku-cli/command'
import {REPOSITORIES_HEADER} from '../api'

export interface PipelineRepository {
  repository?: {
    id?: string
    url?: string
  }
}

export function createPipelineRepository(heroku: APIClient, pipelineId: string, repoUrl: string) {
  return heroku.request<PipelineRepository>(`/pipelines/${pipelineId}/repo`, {
    method: 'POST',
    headers: {Accept: REPOSITORIES_HEADER},
    body: {repo_url: repoUrl},
  })
}

