import {APIClient} from '@heroku-cli/command'
const V3_HEADER = 'application/vnd.heroku+json; version=3'
const PIPELINE_HEADER = `${V3_HEADER}.pipelines`

export async function pipelineCoupling(client: APIClient, app: string) {
  return client.get(`/apps/${app}/pipeline-couplings`)
}

function setConfigVars(client: APIClient, pipelineID: string, body: any) {
  return client.patch(`/pipelines/${pipelineID}/stage/test/config-vars`, {
    headers: {Accept: PIPELINE_HEADER},
    body,
  })
}
