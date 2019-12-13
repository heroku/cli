import {APIClient} from '@heroku-cli/command'
import Heroku from '@heroku-cli/schema'
import {prompt} from 'inquirer'
import {isUUID} from 'validator'

import {
  findPipelineByName,
  getPipeline,
} from './api'

export default async function disambiguate(heroku: APIClient, pipelineIDOrName: string): Promise<Heroku.Pipeline> {
  let pipeline: Heroku.Pipeline

  if (isUUID(pipelineIDOrName)) {
    const result = (await getPipeline(heroku, pipelineIDOrName))
    pipeline = result.body
  } else {
    const {body: pipelines} = await findPipelineByName(heroku, pipelineIDOrName)

    if (pipelines.length === 0) {
      throw new Error('Pipeline not found')
    } else if (pipelines.length === 1) {
      pipeline = pipelines[0]
    } else {
      // Disambiguate
      const choices = pipelines.map(x => {
        return {
          name: new Date(x.created_at!).toString(),
          value: x,
        }
      })

      const questions = [{
        type: 'list',
        name: 'pipeline',
        message: `Which ${pipelineIDOrName} pipeline?`,
        choices,
      }]

      // eslint-disable-next-line no-async-promise-executor
      pipeline = await new Promise(async function (resolve, reject) {
        const answers: any = await prompt(questions)
        if (answers.pipeline) {
          resolve(answers.pipeline)
        } else {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('Must pick a pipeline')
        }
      })
    }
  }

  return pipeline
}
