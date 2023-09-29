import {ux} from '@oclif/core'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {pipelineCoupling} from './heroku-api'
import disambiguatePipeline from '../pipelines/disambiguate'

export async function getPipeline(context: {flags: {pipeline: string}, app: string}, client: APIClient) {
  const pipeline = context.flags.pipeline
  let disambiguatedPipeline: Heroku.Pipeline

  const pipelineOrApp = pipeline || context.app
  if (!pipelineOrApp) ux.error('Required flag:  --pipeline PIPELINE or --app APP', {exit: 1})

  if (pipeline) {
    disambiguatedPipeline = await disambiguatePipeline(client, pipeline)
  } else {
    const coupling: any  = await pipelineCoupling(client, context.app)
    disambiguatedPipeline = coupling.pipeline
  }

  return disambiguatedPipeline
}
