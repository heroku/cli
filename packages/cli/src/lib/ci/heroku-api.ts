import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

const V3_HEADER = 'application/vnd.heroku+json; version=3'
const PIPELINE_HEADER = `${V3_HEADER}.pipelines`

export function configVars(pipelineID: string, command: Command) {
  const headers = {Accept: PIPELINE_HEADER}
  return command.heroku.get<Heroku.Pipeline>(`/pipelines/${pipelineID}/stage/test/config-vars`, {headers})
}
